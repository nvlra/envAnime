const axios = require('axios');
const cheerio = require('cheerio');

class EnvielStream1 {
  constructor() {
    this.baseUrl = 'https://otakudesu.best';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': this.baseUrl,
    };
  }

  async _fetch(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000,
      });
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  _slug(url) {
    return url ? url.replace(/\/$/, '').split('/').pop() : '';
  }

  async getOngoing(page = 1) {
    const url = page === 1 
      ? `${this.baseUrl}/ongoing-anime/` 
      : `${this.baseUrl}/ongoing-anime/page/${page}/`;
    
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to fetch', anime: [] };

    const anime = [];
    $('.venz ul li').each((i, item) => {
      const link = $(item).find('a[href]');
      if (!link.length) return;

      anime.push({
        title: $(item).find('.jdlflm, h2').text().trim() || '',
        slug: this._slug(link.attr('href')),
        poster: $(item).find('img').attr('src') || '',
        episode: $(item).find('.epz').text().trim() || '',
      });
    });

    return { page, anime };
  }

  async getComplete(page = 1) {
    const url = page === 1 
      ? `${this.baseUrl}/complete-anime/` 
      : `${this.baseUrl}/complete-anime/page/${page}/`;
    
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to fetch', anime: [] };

    const anime = [];
    $('.venz ul li').each((i, item) => {
      const link = $(item).find('a[href]');
      if (!link.length) return;

      anime.push({
        title: $(item).find('.jdlflm, h2').text().trim() || '',
        slug: this._slug(link.attr('href')),
        poster: $(item).find('img').attr('src') || '',
      });
    });

    return { page, anime };
  }

  async getAnimeDetail(slug) {
    const url = `${this.baseUrl}/anime/${slug}/`;
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to fetch' };

    const detail = {
      slug,
      title: '',
      synopsis: '',
      poster: '',
      genre: [],
      status: '',
      episodes: [],
    };

    const title = $('.jdlrx, h1').first();
    if (title.length) {
      detail.title = title.text().trim();
    }

    $('.infozingle p, .infozin p').each((i, p) => {
      const text = $(p).text().trim();
      if (text.includes('Status')) {
        detail.status = text.split(':').pop().trim();
      }
    });

    $('a[href*="genre"]').each((i, g) => {
      detail.genre.push($(g).text().trim());
    });

    const syn = $('.sinopc p, .sinopsis p').first();
    if (syn.length) {
      detail.synopsis = syn.text().trim();
    }

    const poster = $('.fotoanime img').first();
    if (poster.length) {
      detail.poster = poster.attr('src') || '';
    }

    $('.episodelist ul li a').each((i, ep) => {
      detail.episodes.push({
        title: $(ep).text().trim(),
        slug: this._slug($(ep).attr('href')),
      });
    });

    detail.episodes = detail.episodes.reverse();
    return detail;
  }

  async getStreaming(episodeSlug) {
    const url = `${this.baseUrl}/episode/${episodeSlug}/`;
    const $ = await this._fetch(url);
    
    if (!$) return { error: 'Failed to fetch' };

    const result = {
      slug: episodeSlug,
      title: '',
      default_embed: '',
      embed_urls: [],
      qualities: [],
    };

    const title = $('h1, .entry-title').first();
    if (title.length) {
      result.title = title.text().trim();
    }

    const embedUrls = [];

    const iframe = $('iframe').first();
    if (iframe.length) {
      result.default_embed = iframe.attr('src') || '';
      if (result.default_embed && !result.default_embed.includes('gofile.io')) {
         embedUrls.push({
           quality: 'Default (HD)',
           host: 'DesuStream',
           embed_url: result.default_embed
         });
      }
    }

    const linkPromises = [];

    for (const li of $('.download ul li').toArray()) {
      const strong = $(li).find('strong');
      if (!strong.length) continue;
      const quality = strong.text().trim(); // e.g. "MKV 1080p"

      for (const a of $(li).find('a').toArray()) {
        const host = $(a).text().trim().toLowerCase();
        const href = $(a).attr('href') || '';

        if (!['mega', 'pdrain'].includes(host)) continue;
        
        if (host === 'mega') {
            if (quality.includes('1080')) continue;
            if (quality.toLowerCase().includes('mkv')) continue;
        }

        linkPromises.push((async () => {
            try {
                const resp = await axios.head(href, {
                  maxRedirects: 0,
                  validateStatus: (status) => status >= 200 && status < 400,
                  timeout: 5000, 
                  headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                  }
                });
        
                const finalUrl = resp.headers.location || href;
                if (!finalUrl) return;
        
                let embedUrl = null;
        
                if (finalUrl.includes('mega.nz/file/')) {
                  embedUrl = finalUrl.replace('/file/', '/embed/');
                } else if (finalUrl.includes('mega.nz/#!')) {
                  embedUrl = finalUrl.replace(/mega\.nz\/#?!/, 'mega.nz/embed/#!');
                }
                

                if (embedUrl) {
                  embedUrls.push({
                    quality, // e.g. "MKV 720p"
                    host: 'Mega', 
                    embed_url: embedUrl,
                  });
                }
            } catch (e) { return; }
        })());
      }
    }
    
    await Promise.all(linkPromises);

    result.embed_urls = embedUrls;

    const qualities = {};
    for (const e of embedUrls) {
      const q = e.quality;
      if (!qualities[q]) {
        qualities[q] = [];
      }
      qualities[q].push({
        host: e.host,
        embed_url: e.embed_url,
      });
    }

    result.qualities = Object.entries(qualities).map(([quality, servers]) => ({
      quality,
      servers,
    }));

    return result;
  }

  async search(query) {
    const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=anime`;
    const $ = await this._fetch(url);
    
    if (!$) return { error: 'Failed to search', results: [] };

    const results = [];
    $('.chi_anime li, .page ul li').each((i, item) => {
      const link = $(item).find('a[href]');
      if (!link.length) return;

      const title = $(item).find('h2, .title');
      results.push({
        title: title.length ? title.text().trim() : link.text().trim(),
        slug: this._slug(link.attr('href')),
        poster: $(item).find('img').attr('src') || '',
        episode: $(item).find('.epz').text().trim() || '',
      });
    });

    return { query, results };
  }
}

class EnvielStream3 {
  constructor() {
    this.baseUrl = 'https://anoboy.si';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': this.baseUrl,
    };
  }

  async _fetch(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000,
      });
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  _slug(url) {
    if (!url) return '';
    const clean = url.replace(/\/$/, '');
    return clean.split('/').pop() || '';
  }

  async getLatest(page = 1) {
    const url = page === 1 
      ? this.baseUrl 
      : `${this.baseUrl}/page/${page}/`;
    
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to fetch', anime: [] };

    const anime = [];
    
    $('article.animpost, .bsx, .bs').each((i, item) => {
      const link = $(item).find('a[href]').first();
      if (!link.length) return;

      const href = link.attr('href') || '';
      const title = $(item).find('.tt, h2, .title').text().trim() || 
                    link.attr('title') || 
                    link.text().trim();
      const poster = $(item).find('img').attr('src') || 
                     $(item).find('img').attr('data-src') || '';
      const episode = $(item).find('.epx, .ep, .episode').text().trim() || 
                      $(item).find('.status').text().trim() || '';
      const status = $(item).find('.sb, .status-badge').text().trim() || '';

      anime.push({
        title: title.replace(/\s+/g, ' ').trim(),
        slug: this._slug(href),
        url: href,
        poster,
        episode,
        status,
      });
    });

    return { page, anime };
  }

  async getAnimeList(page = 1) {
    const url = `${this.baseUrl}/series/?status=&type=&order=update&page=${page}`;
    
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to fetch', anime: [] };

    const anime = [];
    
    $('article.bs, .bsx, .animpost').each((i, item) => {
      const link = $(item).find('a[href]').first();
      if (!link.length) return;

      anime.push({
        title: $(item).find('.tt, h2, .title').text().trim() || link.attr('title') || '',
        slug: this._slug(link.attr('href')),
        url: link.attr('href') || '',
        poster: $(item).find('img').attr('src') || $(item).find('img').attr('data-src') || '',
        type: $(item).find('.typez, .type').text().trim() || '',
        status: $(item).find('.status').text().trim() || '',
      });
    });

    return { page, anime };
  }

  async getAnimeDetail(slug) {
    let $ = await this._fetch(`${this.baseUrl}/anime/${slug}/`);
    if (!$) {
      $ = await this._fetch(`${this.baseUrl}/${slug}/`);
    }
    if (!$) return { error: 'Failed to fetch' };

    const detail = {
      slug,
      title: '',
      synopsis: '',
      poster: '',
      genre: [],
      status: '',
      type: '',
      episodes: [],
    };

    detail.title = $('h1.entry-title, .infox h1, .info-content h1').text().trim() ||
                   $('.title, .entry-title').first().text().trim();

    detail.poster = $('.thumb img, .poster img, .bigcontent img').attr('src') || 
                    $('.thumb img, .poster img').attr('data-src') || '';

    detail.synopsis = $('.entry-content p, .synp p, .synopsis').first().text().trim() || 
                      $('.desc, .description').text().trim();

    $('a[href*="genre"], .genre a, .genxed a').each((i, g) => {
      const genre = $(g).text().trim();
      if (genre && !detail.genre.includes(genre)) {
        detail.genre.push(genre);
      }
    });

    $('.spe span, .infox span, .info span').each((i, span) => {
      const text = $(span).text().trim();
      if (text.toLowerCase().includes('status')) {
        detail.status = text.split(':').pop().trim();
      }
      if (text.toLowerCase().includes('type')) {
        detail.type = text.split(':').pop().trim();
      }
    });

    $('.eplister ul li a, .episodelist a, #episode_list a').each((i, ep) => {
      const episodeUrl = $(ep).attr('href') || '';
      const episodeTitle = $(ep).text().trim();
      
      if (episodeUrl && episodeTitle) {
        detail.episodes.push({
          title: episodeTitle.replace(/\s+/g, ' ').trim(),
          slug: this._slug(episodeUrl),
          url: episodeUrl,
        });
      }
    });

    detail.episodes = detail.episodes.reverse();
    
    return detail;
  }

  async getStreaming(slug) {
    const url = slug.startsWith('http') ? slug : `${this.baseUrl}/${slug}/`;
    const $ = await this._fetch(url);
    
    if (!$) return { error: 'Failed to fetch' };

    const result = {
      slug,
      title: '',
      embed_urls: [],
      download_urls: [],
    };

    result.title = $('h1.entry-title, .entry-title').text().trim() ||
                   $('h1, .title').first().text().trim();

    $('iframe').each((i, iframe) => {
      const src = $(iframe).attr('src') || $(iframe).attr('data-src') || '';
      if (src && !src.includes('facebook') && !src.includes('twitter')) {
        result.embed_urls.push({
          server: `Server ${i + 1}`,
          embed_url: src.startsWith('//') ? 'https:' + src : src,
        });
      }
    });

    const html = $.html();
    const gofileMatches = html.match(/https?:\/\/gofile\.io\/d\/([a-zA-Z0-9]+)/gi) || [];
    gofileMatches.forEach((url, i) => {
      const fileId = url.split('/d/')[1];
      if (fileId && !result.embed_urls.find(e => e.embed_url.includes(fileId))) {
        result.embed_urls.push({
          server: 'Gofile',
          embed_url: `https://gofile.io/e/${fileId}`,
          download_url: url,
        });
      }
    });

    const megaMatches = html.match(/https?:\/\/mega\.nz\/file\/([a-zA-Z0-9#!-_]+)/gi) || [];
    megaMatches.forEach((url, i) => {
      if (!result.embed_urls.find(e => e.embed_url === url.replace('/file/', '/embed/'))) {
        result.embed_urls.push({
          server: 'Mega',
          embed_url: url.replace('/file/', '/embed/'),
          download_url: url,
        });
      }
    });

    $('script').each((i, script) => {
      const content = $(script).html() || '';
      const urlMatches = content.match(/https?:\/\/[^\s"'<>]+\.(mp4|m3u8)[^\s"'<>]*/gi);
      if (urlMatches) {
        urlMatches.forEach(url => {
          if (!result.embed_urls.find(e => e.embed_url === url)) {
            result.embed_urls.push({
              server: 'Direct',
              embed_url: url,
            });
          }
        });
      }
    });

    $('a[href*="gofile"], a[href*="mega"], a[href*="drive.google"], a[href*="mediafire"]').each((i, a) => {
      const href = $(a).attr('href') || '';
      const text = $(a).text().trim();
      
      if (href && !result.download_urls.find(d => d.url === href)) {
        result.download_urls.push({
          host: text || 'Unknown',
          url: href,
        });
      }
    });

    $('[data-video], [data-src], .server-list button, .mirror a').each((i, btn) => {
      const dataUrl = $(btn).attr('data-video') || 
                      $(btn).attr('data-src') || 
                      $(btn).attr('href') || '';
      const serverName = $(btn).text().trim();
      
      if (dataUrl && !result.embed_urls.find(e => e.embed_url === dataUrl)) {
        result.embed_urls.push({
          server: serverName || `Mirror ${i + 1}`,
          embed_url: dataUrl.startsWith('//') ? 'https:' + dataUrl : dataUrl,
        });
      }
    });

    return result;
  }

  async search(query) {
    const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}`;
    const $ = await this._fetch(url);
    
    if (!$) return { error: 'Failed to search', results: [] };

    const results = [];
    
    $('article.animpost, article.bs, .bsx').each((i, item) => {
      const link = $(item).find('a[href]').first();
      if (!link.length) return;

      results.push({
        title: $(item).find('.tt, h2, .title').text().trim() || 
               link.attr('title') || 
               link.text().trim(),
        slug: this._slug(link.attr('href')),
        url: link.attr('href') || '',
        poster: $(item).find('img').attr('src') || 
                $(item).find('img').attr('data-src') || '',
      });
    });

    return { query, results };
  }
}

class EnvielBatch {
  constructor() {
    this.baseUrl = 'https://kusonime.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': this.baseUrl,
    };
  }

  async _fetch(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000,
      });
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  _slug(url) {
    if (!url) return '';
    return url.replace(/\/$/, '').split('/').pop() || '';
  }

  async getLatest(page = 1) {
    const url = page === 1 ? this.baseUrl : `${this.baseUrl}/page/${page}/`;
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to fetch', anime: [] };

    const anime = [];
    
    $('.vemark, .venz ul li, .kover').each((i, item) => {
      const link = $(item).find('a[href]').first();
      if (!link.length) return;

      const title = $(item).find('.jdlflm, h2, .title').text().trim() || 
                    link.attr('title') || '';
      const poster = $(item).find('img').attr('src') || '';
      const genres = [];
      $(item).find('.genre a, .genres a').each((j, g) => {
        genres.push($(g).text().trim());
      });

      anime.push({
        title: title.replace(/\s+/g, ' ').trim(),
        slug: this._slug(link.attr('href')),
        url: link.attr('href') || '',
        poster,
        genres,
      });
    });

    return { page, anime };
  }

  async getAnimeDetail(slug) {
    const url = `${this.baseUrl}/${slug}/`;
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to fetch' };

    const detail = {
      slug,
      title: '',
      synopsis: '',
      poster: '',
      info: {},
      downloads: [],
    };

    detail.title = $('h1.jdlz, .jdlz').text().trim() ||
                   $('h1, .entry-title').first().text().trim();

    detail.poster = $('.post-thumb img, .thumb img').attr('src') || '';

    detail.synopsis = $('.sinopc p, .synp p').first().text().trim();

    $('.info p, .infozingle p').each((i, p) => {
      const text = $(p).text().trim();
      const parts = text.split(':');
      if (parts.length >= 2) {
        detail.info[parts[0].trim().toLowerCase()] = parts.slice(1).join(':').trim();
      }
    });

    $('.smokeddl, .download-eps, .dlbox').each((i, box) => {
      const quality = $(box).find('.smokettl, strong').first().text().trim() || 'Unknown';
      const links = [];

      $(box).find('a').each((j, a) => {
        const href = $(a).attr('href') || '';
        const host = $(a).text().trim();
        if (href && host) {
          links.push({ host, url: href });
        }
      });

      if (links.length > 0) {
        detail.downloads.push({ quality, links });
      }
    });

    return detail;
  }

  async search(query) {
    const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=post`;
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to search', results: [] };

    const results = [];
    
    $('.vemark, .venz ul li, .kover').each((i, item) => {
      const link = $(item).find('a[href]').first();
      if (!link.length) return;

      results.push({
        title: $(item).find('.jdlflm, h2, .title').text().trim() || link.attr('title') || '',
        slug: this._slug(link.attr('href')),
        url: link.attr('href') || '',
        poster: $(item).find('img').attr('src') || '',
      });
    });

    return { query, results };
  }
}

class EnvielStream2 {
  constructor() {
    this.baseUrl = 'https://anime.oploverz.ac';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': this.baseUrl,
    };
  }

  async _fetch(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000,
      });
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`[OploverzAC] Error fetching ${url}:`, error.message);
      return null;
    }
  }

  async _fetchRaw(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error(`[OploverzAC] Error fetching ${url}:`, error.message);
      return null;
    }
  }

  _slugFromUrl(url) {
    if (!url) return '';
    const match = url.match(/\/series\/([^\/]+)/);
    return match ? match[1] : url.replace(/\/$/, '').split('/').pop() || '';
  }

  async getLatest(page = 1) {
    const url = page === 1 
      ? this.baseUrl 
      : `${this.baseUrl}/page/${page}`;
    
    const $ = await this._fetch(url);
    if (!$) return { error: 'Failed to fetch', anime: [] };

    const anime = [];
    const seen = new Set();

    $('a[href*="/series/"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      
      if (href.includes('/episode/') || !href.includes('/series/')) return;
      
      const slug = this._slugFromUrl(href);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);

      const title = $(el).text().trim() || $(el).attr('title') || '';
      const img = $(el).find('img').first();
      const poster = img.attr('src') || img.attr('data-src') || '';
      
      if (title && title.length > 2 && !title.includes('Beranda') && !title.includes('Daftar')) {
        anime.push({
          title: title.replace(/\s+/g, ' ').trim(),
          slug,
          url: href,
          poster,
        });
      }
    });

    return { page, anime };
  }

  async getAnimeDetail(slug) {
    const url = `${this.baseUrl}/series/${slug}`;
    const html = await this._fetchRaw(url);
    
    if (!html) return { error: 'Failed to fetch' };

    const $ = cheerio.load(html);

    const detail = {
      slug,
      title: '',
      alternative: '',
      poster: '',
      synopsis: '',
      info: {},
      genre: [],
      status: '',
      type: '',
      episodes: [],
    };

    const breadcrumb = $('a[href*="/series/' + slug + '"]').last();
    detail.title = breadcrumb.text().trim() || 
                   $('h1').first().text().trim() ||
                   $('title').text().replace('| Oploverz', '').trim();

    const ogImage = $('meta[property="og:image"]').attr('content');
    detail.poster = ogImage || $('img').first().attr('src') || '';

    $('p').each((i, p) => {
      const text = $(p).text().trim();
      if (text.length > 100 && !detail.synopsis) {
        detail.synopsis = text;
      }
    });

    $('li').each((i, li) => {
      const text = $(li).text().trim();
      if (text.includes('Tipe:')) detail.type = text.replace('Tipe:', '').trim();
      if (text.includes('Status:')) detail.status = text.replace('Status:', '').trim();
      if (text.includes('Studio:')) detail.info.studio = text.replace('Studio:', '').trim();
      if (text.includes('Genre:')) {
        detail.genre = text.replace('Genre:', '').trim().split(',').map(g => g.trim());
      }
    });

    const episodeLinks = [];
  // Select all links that might be episodes. 
  // Oploverz usually has a list. Try typical selectors or just all links in the main area.
  // Better selector might be needed, but let's broaden the href filter first.
  $('a').each((i, ep) => {
    const href = $(ep).attr('href') || '';
    const text = $(ep).text().trim();
    
    // Check if it looks like an episode link for this anime
    // Typical OP patterns: "one-piece-episode-100", "series/one-piece/episode/100"
    // And usually contains the anime slug or "episode"
    
    if(!href.includes(slug) && !href.includes('episode')) return;
    
    // Avoid non-episode links
    if(href.includes('/series/') && !href.includes('/episode/')) return; 

    // Try to extract number
    let epNum = null;
    
    // Pattern 1: /series/slug/episode/123
    const match1 = href.match(/\/series\/[^/]+\/episode\/(\d+)/);
    if(match1) epNum = parseInt(match1[1]);
    
    // Pattern 2: slug-episode-123
    if(!epNum) {
         // regex for "episode-123"
         const match2 = href.match(/episode-(\d+)/);
         if(match2) epNum = parseInt(match2[1]);
    }

    if(epNum !== null) {
      const title = text || `Episode ${epNum}`;
      
      // Check duplicate
      if (!episodeLinks.find(e => e.number === epNum)) {
        episodeLinks.push({
          number: epNum,
          title: title.includes('Episode') ? title : `Episode ${epNum}`,
          slug: href, // Store full URL or slug that fetchStream can handle? 
                      // fetchStream currently expects a slug. 
                      // Stream2.getStreaming uses `slug` in `_fetchRaw(slug)`? 
                      // Let's check getStreaming implementation. 
                      // It seems it takes a slug. If we pass full URL, we might need to handle it.
                      // server.js unified endpoint stores this as `slug`.
                      // index.html passes it to fetchStream.
                      // fetchStream -> server generic -> server unified logic?
                      // Wait, server generic DOES NOT support full url slugs well.
                      // BUT my NEW fetchStream in index.html calls `Stream2/streaming/FULL_SLUG` if source is Stream2.
                      // So storing the full HREF here (or relative) is safer if getStreaming supports it.
          url: href,
          source: 'Stream2'
        });
      }
    }
  });

    detail.episodes = episodeLinks.sort((a, b) => a.number - b.number);

    return detail;
  }

  async getStreaming(slug, episodeNum) {
    let url;
    
    if (episodeNum) {
      url = `${this.baseUrl}/series/${slug}/episode/${episodeNum}`;
    } else if (slug.includes('/episode/')) {
      url = `${this.baseUrl}/series/${slug}`;
    } else {
      url = slug.startsWith('http') ? slug : `${this.baseUrl}/series/${slug}`;
    }

    const html = await this._fetchRaw(url);
    
    if (!html) return { error: 'Failed to fetch' };

    const $ = cheerio.load(html);

    const result = {
      slug,
      episode: episodeNum,
      title: '',
      embed_urls: [],
      download_urls: [],
    };

    result.title = $('title').text().replace('| Oploverz', '').trim();

    // Extract FileDon embed URLs from SvelteKit data
    const embedPattern = /\{source:"([^"]+)",url:"(https:\/\/filedon\.co\/embed\/[^"]+)"\}/g;
    const seen = new Set();
    let match;
    
    while ((match = embedPattern.exec(html)) !== null) {
      const [, quality, embedUrl] = match;
      
      if (seen.has(embedUrl) || embedUrl.includes('/view/')) continue;
      seen.add(embedUrl);
      
      result.embed_urls.push({
        quality: quality,
        server: 'FileDon',
        embed_url: embedUrl,
      });
    }

    // Prioritize by quality: 1080p > 720p > 480p > 360p
    const qualityOrder = ['1080', '720', '480', '360'];
    result.embed_urls.sort((a, b) => {
      const aQ = qualityOrder.findIndex(q => (a.quality || '').includes(q));
      const bQ = qualityOrder.findIndex(q => (b.quality || '').includes(q));
      const aIdx = aQ === -1 ? 99 : aQ;
      const bIdx = bQ === -1 ? 99 : bQ;
      return aIdx - bIdx;
    });

    return result;
  }

  async search(query) {
    const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}`;
    const $ = await this._fetch(url);
    
    if (!$) return { error: 'Failed to search', results: [] };

    const candidateMap = new Map();
  
  $('a[href*="/series/"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes('/episode/')) return;
    
    const slug = this._slugFromUrl(href);
    if (!slug) return;

    let title = $(el).text().trim() || $(el).attr('title') || '';
    const img = $(el).find('img').first();
    const poster = img.attr('src') || img.attr('data-src') || '';
    
    // Clean title
    title = title.replace(/\s+/g, ' ').trim();
    
    // Filter generic titles that might come from buttons
    const generics = ['Mulai Sekarang', 'Watch Now', 'Read More', 'More', 'Lanjut', 'Seterusnya', 'Beranda', 'Daftar', 'Jadwal'];
    if(generics.some(g => title.toLowerCase() === g.toLowerCase())) {
        title = ''; // Valid link but useless title
    }

    if (!candidateMap.has(slug)) {
        candidateMap.set(slug, { title: '', slug, url: href, poster: '' });
    }
    
    const current = candidateMap.get(slug);
    
    // Update if we found a better title
    if (title.length > current.title.length) {
        current.title = title;
    }
    // Update if we found a poster
    if (poster && !current.poster) {
        current.poster = poster;
    }
  });

  const results = Array.from(candidateMap.values()).filter(r => r.title.length > 2);
  return { query, results };
}

}
module.exports = { EnvielStream1, EnvielStream3, EnvielBatch, EnvielStream2 };
