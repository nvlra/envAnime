require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  EnvielStream1,
  EnvielStream3,
  EnvielBatch,
  EnvielStream2,
} = require("./enviel");
const rateLimitMiddleware = require("./middleware/rateLimit");
const domainWhitelist = require("./middleware/domainWhitelist");
const {
  transformResponse,
  getAliasFromSource,
  getSourceFromAlias,
  STREAMING_PRIORITY,
} = require("./middleware/alias");
const app = express();
const envielStream1 = new EnvielStream1();
const envielStream3 = new EnvielStream3();
const envielBatch = new EnvielBatch();
const envielStream2 = new EnvielStream2();
const sources = {
  otakudesu: envielStream1,
  oploverzac: envielStream2,
  anoboy: envielStream3,
  kusonime: envielBatch,
};
app.use(cors());
app.use(express.json());

app.use(domainWhitelist);
app.use(rateLimitMiddleware);

const NodeCache = require("node-cache");
const apiCache = new NodeCache({ stdTTL: 600 });

const verifyCache = (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const key = req.originalUrl;
    const cached = apiCache.get(key);
    
    if (cached) {
        return res.json(cached);
    }
    
    const originalJson = res.json;
    res.json = (body) => {
        if(body.success) apiCache.set(key, body);
        res.originalJson = originalJson;
        return res.originalJson(body);
    };
    next();
};
app.use(verifyCache);

app.use(rateLimitMiddleware);
const sendResponse = (res, data, status = 200) => {
  const transformed = transformResponse(data);
  res.status(status).json(transformed);
};
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "EnvielAnime API running."
  });
});
app.get("/streaming/:anime/:episode", async (req, res) => {
  const { anime, episode } = req.params;
  const slug = `${anime}-episode-${episode}`;
  const result = {
    anime,
    episode: parseInt(episode),
    embed: null,
    alternatives: [],
    errors: [],
  };
  for (const sourceName of STREAMING_PRIORITY) {
    try {
      const source = sources[sourceName];
      const data = await source.getStreaming(slug);
      if (
        data &&
        !data.error &&
        data.embed_urls &&
        data.embed_urls.length > 0
      ) {
        const qualityOrder = ["1080", "720", "480", "360"];
        const sortedEmbeds = data.embed_urls.sort((a, b) => {
          const qA = (a.quality || "").toString();
          const qB = (b.quality || "").toString();
          const idxA = qualityOrder.findIndex((q) => qA.includes(q));
          const idxB = qualityOrder.findIndex((q) => qB.includes(q));
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });

        const bestEmbed = sortedEmbeds[0];
        
        sortedEmbeds.forEach((emb) => {
             const info = {
                server: `${getAliasFromSource(sourceName)} ${emb.quality || ""} [${emb.server || "Mirror"}]`,
                embed_url: emb.embed_url,
                quality: emb.quality || "default"
             };
             
             if (!result.embed) {
                if (emb === bestEmbed) {
                    result.embed = info;
                    result.title = data.title;
                } else {
                    result.alternatives.push(info);
                }
             } else {
                result.alternatives.push(info);
             }
        });
      }
    } catch (error) {
      result.errors.push({
        server: getAliasFromSource(sourceName),
        error: error.message,
      });
    }
  }
  if (!result.embed) {
    return res.status(404).json({
      success: false,
      error: "No streaming source available",
      tried: STREAMING_PRIORITY.map(getAliasFromSource),
    });
  }
  sendResponse(res, { success: true, data: result });
});
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, error: 'Query parameter "q" is required' });
    }
    const results = [];
    const errors = [];
    const searchPromises = STREAMING_PRIORITY.map(async (sourceName) => {
      try {
        const source = sources[sourceName];
        const data = await source.search(query);
        if (data && data.results) {
          return { source: sourceName, results: data.results };
        }
      } catch (error) {
        errors.push({
          source: getAliasFromSource(sourceName),
          error: error.message,
        });
      }
      return null;
    });
    const normalizeTitle = (t) => {
        return t.toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove symbols/spaces
            .replace(/subindo/g, '')
            .replace(/subtitleindonesia/g, '')
            .replace(/episode\d+/g, ''); // Remove specific episode markers if any
    };

    const searchResults = await Promise.all(searchPromises);
    
    searchResults.forEach((sr) => {
      if (sr && sr.results) {
        sr.results.forEach((item) => {
          const normItem = normalizeTitle(item.title);
          
          const existing = results.find(
            (r) => normalizeTitle(r.title) === normItem || 
                   (normItem.length > 5 && normalizeTitle(r.title).includes(normItem)) ||
                   (normalizeTitle(r.title).length > 5 && normItem.includes(normalizeTitle(r.title)))
          );

          const sourceAlias = getAliasFromSource(sr.source);

          if (existing) {
             if (!existing.sources.includes(sourceAlias)) {
                existing.sources.push(sourceAlias);
                existing.source_slugs[sourceAlias] = item.slug;
             }
          } else {
            results.push({
              title: item.title,
              slug: item.slug,
              poster: item.poster,
              sources: [sourceAlias],
              source_slugs: { [sourceAlias]: item.slug },
            });
          }
        });
      }
    });
    sendResponse(res, { success: true, query, results, errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream1/ongoing", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await envielStream1.getOngoing(page);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream1/complete", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await envielStream1.getComplete(page);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream1/anime/:slug", async (req, res) => {
  try {
    var data = await envielStream1.getAnimeDetail(req.params.slug);
    if (data.error) {
      return res.status(404).json({ success: false, error: data.error });
    }

    if (data.episodes && data.episodes.length > 0) {
        const unique = new Map();
        data.episodes.forEach((ep) => {
            const m =
                ep.title.match(/Episode\s+(\d+)/i) ||
                ep.title.match(/Ep\s+(\d+)/i) ||
                ep.title.match(/(\d+)/);
            
            if (m) {
                const num = parseInt(m[1]);
                if (!isNaN(num)) {
                    const isBatch =
                        ep.title.toLowerCase().includes("batch") ||
                        /\d+\s*[-–]\s*\d+/.test(ep.title);

                    if (unique.has(num)) {
                         const existing = unique.get(num);
                         const exBatch = existing.title.toLowerCase().includes("batch") || /\d+\s*[-–]\s*\d+/.test(existing.title);
                         
                         if (exBatch && !isBatch) {
                             unique.set(num, ep);
                         }
                    } else {
                        unique.set(num, ep);
                    }
                } else {
                     unique.set(ep.title, ep);
                }
            } else {
                unique.set(ep.title, ep);
            }
        });

    data.episodes = Array.from(unique.values()).sort((a, b) => {
         const getNum = (t) => {
              const m = t.match(/Episode\s+(\d+)/i) || t.match(/Ep\s+(\d+)/i) || t.match(/(\d+)/);
              return m ? parseInt(m[1]) : 99999;
         };
         return (a.number || getNum(a.title)) - (b.number || getNum(b.title));
    });

    data.episodes.forEach(ep => {
        if(ep.streams && ep.streams.length > 1) {
            ep.streams.sort((a, b) => {
                if(!a.isBatch && b.isBatch) return -1;
                if(a.isBatch && !b.isBatch) return 1;
                
                const priority = ['Stream2', 'Stream3', 'Batch1', 'Stream1'];
                const pA = priority.indexOf(a.source);
                const pB = priority.indexOf(b.source);
                const idxA = pA === -1 ? 99 : pA;
                const idxB = pB === -1 ? 99 : pB;
                
                return idxA - idxB;
            });
            
            const best = ep.streams[0];
            ep.title = best.title;
            ep.source = best.source;
            ep.slug = best.slug;
            ep.isBatch = best.isBatch;
        }
    });
    }

    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream1/streaming/:slug", async (req, res) => {
  try {
    const data = await envielStream1.getStreaming(req.params.slug);
    if (data.error) {
      return res.status(404).json({ success: false, error: data.error });
    }
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream1/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, error: 'Query parameter "q" is required' });
    }
    const data = await envielStream1.search(query);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream2/latest", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await envielStream2.getLatest(page);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream2/anime/:slug", async (req, res) => {
  try {
    const data = await envielStream2.getAnimeDetail(req.params.slug);
    if (data.error) {
      return res.status(404).json({ success: false, error: data.error });
    }
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream2/streaming/:slug/:episode", async (req, res) => {
  try {
    const { slug, episode } = req.params;
    const data = await envielStream2.getStreaming(slug, parseInt(episode));
    if (data.error) {
      return res.status(404).json({ success: false, error: data.error });
    }
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream2/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, error: 'Query parameter "q" is required' });
    }
    const data = await envielStream2.search(query);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream3/latest", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await envielStream3.getLatest(page);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream3/list", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await envielStream3.getAnimeList(page);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream3/anime/:slug", async (req, res) => {
  try {
    const data = await envielStream3.getAnimeDetail(req.params.slug);
    if (data.error) {
      return res.status(404).json({ success: false, error: data.error });
    }
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream3/streaming/:slug", async (req, res) => {
  try {
    const data = await envielStream3.getStreaming(req.params.slug);
    if (data.error) {
      return res.status(404).json({ success: false, error: data.error });
    }
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Stream3/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, error: 'Query parameter "q" is required' });
    }
    const data = await envielStream3.search(query);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Batch1/latest", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await envielBatch.getLatest(page);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Batch1/anime/:slug", async (req, res) => {
  try {
    const data = await envielBatch.getAnimeDetail(req.params.slug);
    if (data.error) {
      return res.status(404).json({ success: false, error: data.error });
    }
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/Batch1/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, error: 'Query parameter "q" is required' });
    }
    const data = await envielBatch.search(query);
    sendResponse(res, { success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/anime/details", async (req, res) => {
    try {
        const { source_slugs } = req.body;
        if(!source_slugs) return res.status(400).json({success:false, error: "Missing source_slugs"});

        
        const normalizeSlug = (slug) => {
            if (!slug) return slug;
            const arcPatterns = [
                /-gyojin-tou-hen$/,
                /-wano-kuni-hen$/,
                /-dressrosa-hen$/,
                /-zou-hen$/,
                /-shippuden$/,           // Separate series, but keep for completeness
                /-part-\d+$/,
                /-season-\d+$/,
                /-s\d+$/,
                /-episode-.*$/,
                /-batch$/
            ];
            let normalized = slug;
            arcPatterns.forEach(p => {
                normalized = normalized.replace(p, '');
            });
            return normalized;
        };
        
        Object.keys(source_slugs).forEach(alias => {
            const original = source_slugs[alias];
            const normalized = normalizeSlug(original);
            if (normalized !== original) {
                console.log(`[UNIFIED] Normalizing slug for ${alias}: ${original} -> ${normalized}`);
                source_slugs[alias] = normalized;
            }
        });
        
        const generateSlugsFromTitle = (title) => {
            const baseSlug = title.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .trim()
                .replace(/\s+/g, '-');
            
            return {
                'Stream1': [
                    baseSlug + '-sub-indo',
                    baseSlug.replace(/-/g, ''),
                    baseSlug.replace('one-piece', '1piece') + '-sub-indo',
                ],
                'Stream2': [
                    baseSlug,
                    baseSlug + '-subtitle-indonesia',
                ],
                'Stream3': [
                    baseSlug,
                    baseSlug + '-sub-indo',
                ]
            };
        };

        const anySlug = Object.values(source_slugs)[0] || '';
        let titleHint = anySlug
            .replace(/-sub-indo.*$/, '')
            .replace(/-subtitle-indonesia.*$/, '')
            .replace(/1piece/, 'one-piece')
            .replace(/-/g, ' ')
            .trim();

        const probableSlugs = generateSlugsFromTitle(titleHint);

        if (!source_slugs['Stream2'] && probableSlugs['Stream2']) {
            source_slugs['Stream2'] = probableSlugs['Stream2'][0];
        }
        if (!source_slugs['Stream3'] && probableSlugs['Stream3']) {
            source_slugs['Stream3'] = probableSlugs['Stream3'][0];
        }

        const canonicalOverrides = {
            'one-piece': 'one-piece',
            '1piece': 'one-piece',
            'naruto': 'naruto',
            'bleach': 'bleach',
            'dragon-ball': 'dragon-ball',
            'boruto': 'boruto',
            'fairy-tail': 'fairy-tail',
            'hunter-x-hunter': 'hunter-x-hunter'
        };
        
        const allSlugs = Object.values(source_slugs).join(' ').toLowerCase();
        for (const [pattern, canonical] of Object.entries(canonicalOverrides)) {
            if (allSlugs.includes(pattern)) {
                source_slugs['Stream2'] = canonical;
                source_slugs['Stream3'] = canonical;
                console.log(`[UNIFIED] FORCED canonical override for "${pattern}":`, { Stream2: canonical, Stream3: canonical });
                break;
            }
        }
        
        console.log(`[UNIFIED] Final Slugs:`, source_slugs);

        const promises = [];
        const aliasMap = {
            'Stream1': 'otakudesu',
            'Stream2': 'oploverz',
            'Stream3': 'anoboy',
            'Batch1' : 'kusonime'
        };

        Object.keys(source_slugs).forEach(alias => {
             const key = aliasMap[alias];
             const source = sources[key];
             const slug = source_slugs[alias];
             if(source && slug) {
                 promises.push(source.getAnimeDetail(slug).then(d => ({ ...d, _sourceName: alias })));
             }
        });

        const results = await Promise.all(promises);
        
        let master = {
            title: "",
            poster: "",
            synopsis: "",
            episodes: []
        };

        const episodeMap = new Map();

        results.forEach(data => {
            if(data.error) return;
            if(!master.title) master.title = data.title;
            if(!master.poster) master.poster = data.poster;
            if(!master.synopsis) master.synopsis = data.synopsis;

            if(data.episodes) {
                data.episodes.forEach(ep => {
                     let num = 999999;
                     const m = ep.title.match(/Episode\s+(\d+)/i) || ep.title.match(/Ep\s+(\d+)/i) || ep.title.match(/(\d+)/);
                     if(m) num = parseInt(m[1]);

                     const isBatch = ep.title.toLowerCase().includes("batch") || /\d+\s*[-–]\s*\d+/.test(ep.title);

                     const streamObj = {
                         source: data._sourceName,
                         slug: ep.slug,
                         title: ep.title,
                         isBatch
                     };

                     if(episodeMap.has(num)) {
                         const existing = episodeMap.get(num);

                         existing.streams.push(streamObj);
                         
                         let currentIsBest = false;
                         
                         if(existing.isBatch && !isBatch) currentIsBest = true;
                         else if ((existing.isBatch === isBatch)) {
                             if(streamObj.source === 'Stream2' && existing.source !== 'Stream2') currentIsBest = true;
                             else if(streamObj.source === 'Stream3' && existing.source !== 'Stream2' && existing.source !== 'Stream3') currentIsBest = true;
                         }

                         if(currentIsBest) {
                             existing.title = ep.title;
                             existing.slug = ep.slug;
                             existing.source = data._sourceName;
                             existing.isBatch = isBatch;
                         }
                         
                     } else {
                         episodeMap.set(num, {
                             number: num,
                             title: ep.title,
                             slug: ep.slug,
                             source: data._sourceName,
                             isBatch: isBatch,
                             streams: [streamObj]
                         });
                     }
                });
            }
        });

        master.episodes = Array.from(episodeMap.values()).sort((a,b) => a.number - b.number);
        
        sendResponse(res, { success: true, data: master });

    } catch(e) {
        res.status(500).json({success:false, error: e.message});
    }
});


// --- UNIFIED DETAILS ENDPOINT ---
app.get("/anime/details/:slug", async (req, res) => {
    try {
        const primarySlug = req.params.slug;
        
        // 1. Determine Search Title
        // Strategy: 
        // A. Optimistically try to fetch details from Stream1 (Otakudesu) using the proper slug, 
        //    because users mostly come from there. If successful, use the Real Clean Title (e.g. "One Piece")
        //    to search other sources. This fixes "1piece" vs "One Piece" mismatch.
        // B. If that fails, assume slug is general or from another source, and clean it.

        let searchTitle = primarySlug.replace(/-/g, ' ').replace(/episode \d+/i, '').trim();
        let preFetchedDetail = null;
        const mainSourceKey = getSourceFromAlias('Stream1'); // otakudesu

        try {
            // Check if primarySlug works on Stream1
            const mainSource = sources[mainSourceKey];
            const detail = await mainSource.getAnimeDetail(primarySlug);
            if(detail && !detail.error && detail.title) {
                // SUCCESS: We have the real title!
                preFetchedDetail = { source: 'Stream1', detail };
                searchTitle = detail.title; // e.g. "One Piece"
                // Clean common suffixes from the title itself if needed? 
                // Otakudesu titles often have "Subtitle Indonesia". Remove it for better search.
                searchTitle = searchTitle.replace(/Subtitle Indonesia/i, '').replace(/Sub Indo/i, '').trim();
            }
        } catch(e) { /* ignore */ }

        // 2. Search ALL sources (except Stream1 if we already have it? No, search anyway or skip?)
        // If we found Stream1 detail, we don't need to search Stream1 again, but we DO need to search others.
        // If we didn't, we search all.
        
        const searchPromises = STREAMING_PRIORITY.map(async (sourceName) => {
            // Skip searching Stream1 if we already have it
            if (preFetchedDetail && sourceName === 'Stream1') return null;

            try {
                const sourceKey = getSourceFromAlias(sourceName);
                const source = sources[sourceKey];
                const data = await source.search(searchTitle);
                if (data && data.results) return { source: sourceName, results: data.results };
            } catch (e) { /* ignore error */ }
            return null;
        });

        const searchResults = await Promise.all(searchPromises);
        
        // 3. Match Logic
        const sourceSlugs = {};
        
        // If we prefetched, add it
        if(preFetchedDetail) {
             sourceSlugs['Stream1'] = primarySlug;
        }

        const normalize = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetNorm = normalize(searchTitle);

        searchResults.forEach(sr => {
            if (!sr) return;
            // Find best match
            const best = sr.results.find(r => {
                const rNorm = normalize(r.title);
                // "onepiece" vs "onepiece" -> Match!
                return rNorm.includes(targetNorm) || targetNorm.includes(rNorm);
            });
            
            if (best) {
                sourceSlugs[sr.source] = best.slug;
            }
        });

        // Ensure we at least try the primary slug on Stream1 if not found (fallback)
        // Stream1 alias maps to 'otakudesu' key
        const stream1Key = getSourceFromAlias('Stream1'); // otakudesu
        if (!sourceSlugs[stream1Key]) sourceSlugs[stream1Key] = primarySlug;

        // 4. Fetch Details from all matched sources
        const detailPromises = Object.entries(sourceSlugs).map(async ([sourceName, slug]) => {
            try {
                // sourceName might be 'otakudesu' (from search) or 'Stream1' (if logic was mixed).
                // Ensure we get the correct key for the sources map.
                const sourceKey = getSourceFromAlias(sourceName); 
                const source = sources[sourceKey];
                
                if (!source) return null; // Should not happen if keys correct

                const detail = await source.getAnimeDetail(slug);
                if (detail && !detail.error) {
                    return { source: sourceName, detail };
                }
            } catch (e) { /* ignore */ }
            return null;
        });

        const detailsResults = await Promise.all(detailPromises);
        
        // 5. Merge Data
        let masterDetail = null;
        const allEpisodes = [];

        detailsResults.forEach(res => {
            if (!res) return;
            const { source, detail } = res;
            
            // Pick the first successful detail as master for metadata (title, image, synopsis)
            if (!masterDetail) {
                masterDetail = {
                    title: detail.title,
                    poster: detail.poster || detail.image,
                    synopsis: detail.synopsis || detail.description,
                    genre: detail.genre || detail.genres,
                    status: detail.status,
                    slug: primarySlug // Keep original requested slug as ID
                };
            }

            // Collect episodes
            if (detail.episodes) {
                detail.episodes.forEach(ep => {
                    allEpisodes.push({ ...ep, source: source, originalSlug: ep.slug });
                });
            }
        });

        if (!masterDetail) {
             return res.status(404).json({ success: false, error: 'Anime not found' });
        }

        // 6. Merge Episodes using the helper logic
        const episodeMap = new Map();
        const getNum = (title) => {
            const match = title.match(/Episode\s+(\d+(\.\d+)?)/i);
            if (match) return parseFloat(match[1]);
            const num = title.match(/\d+/);
            return num ? parseFloat(num[0]) : 0;
        };

        allEpisodes.forEach(ep => {
            let num = ep.number;
            if (num === undefined || num === null || String(num).trim() === '') {
                num = getNum(ep.title);
            }
            
            if (!episodeMap.has(num)) {
                // Construct a standardized episode object
                // Note: The 'slug' for the episode should probably preserve the source it came from
                // But the front-end 'fetchStream' needs to know WHICH source to ask.
                // Current front-end logic: fetchStream(epSlug, animeSlug) -> calls /streaming/:anime/:episode
                // The /streaming endpoint iterates sources itself!
                // So... if we just give it the EPISODE NUMBER in the slug, /streaming logic might work if it searches?
                // ACTUALLY: /streaming/:anime/:episode endpoint constructs `slug = ${anime}-episode-${episode}` and tries that on all sources.
                // This implies strict naming convention.
                // IF we return episodes from Stream2 (e.g. "oploverz-pie-100"), passing that to /streaming might fail if it expects constructed slug.
                //
                // BETTER APPROACH FOR UNIFIED STREAMING:
                // Return the actual playable slug but we might need a way to tell frontend "Use this slug with THIS source directly" 
                // OR rely on /streaming to find it.
                // 
                // Let's stick to the /streaming logic: It iterates sources.
                // So if we just provide "1", "2", "3", the UI shows "Ep 1".
                // When clicked, it requests /streaming/anime-slug/1.
                // Server constructs "anime-slug-episode-1".
                // Will "one-piece-episode-901" work on Oploverz? 
                // If Oploverz uses "one-piece-901-sub-indo", then the strict construction FAILS.
                //
                // SOLUTION: 
                // 1. The unified details provided specific "stream_slugs" for each source in the episode object?
                // 2. OR simpler: Just return the merged list. If /streaming endpoint is smart enough, it works.
                // The current /streaming endpoint is NOT smart enough for variable slugs. It iterates STREAMING_PRIORITY and constructs ONE slug format.
                //
                // TO FIX THE GAP (200-901), we likely need the episodes to point to the correct slug IF it varies.
                // But index.html `fetchStream` takes (epSlug, animeSlug).
                // And calls /streaming/:anime/:episode.
                //
                // Let's modify the episode object to include `slug`.
                // If we use the slug from the extraction, it is the correct slug for THAT source.
                // We should pass that to the frontend.
                // BUT the frontend currently calls `/streaming/slug/num`.
                // We need `index.html` to be smarter or `server.js` `/streaming` to be smarter.
                // 
                // Let's update `index.html` to call a new `/streaming/unified?slug=X` ?
                // No, user wants simple "gap fix".
                // The gap exists because Stream1 doesn't have eps 200-900. Stream2 might.
                // If we return Ep 500 from Stream2, it has slug "oploverz-500".
                // Frontend calls fetchStream("oploverz-500", ...).
                // currently index.html tries to parse number from slug if strict.
                //
                // Let's just return the merged episodes. The `slug` property in the array will be the VALID slug from the source we found it in.
                // We need to trust `index.html` to handle it.
                //
                episodeMap.set(num, {
                    title: ep.title,
                    slug: ep.slug, // This is the specific slug from the source (e.g. 'one-piece-200')
                    number: num,
                    source: ep.source // Track which source provided this
                });
            }
        });
        
        masterDetail.episodes = Array.from(episodeMap.values()).sort((a, b) => a.number - b.number);
        
        sendResponse(res, { success: true, data: masterDetail });

    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`[ENVIEL] Anime Streaming API running on http://localhost:${PORT}`);
    console.log(`[ENVIEL] Sources: Stream1, Stream2, Stream3, Batch1`);
  });
}
