const { EnvielStream1, EnvielStream2, EnvielStream3, EnvielBatch } = require('./enviel');
const sourcemap = {
    otakudesu: new EnvielStream1(),
    oploverz: new EnvielStream2(),
    anoboy: new EnvielStream3(),
    kusonime: new EnvielBatch()
};

const STREAMING_PRIORITY = ["otakudesu", "oploverzac", "anoboy", "kusonime"];
const getSourceFromAlias = (alias) => {
    switch(alias) {
        case 'Stream1': return 'otakudesu';
        case 'Stream2': return 'oploverzac';
        case 'Stream3': return 'anoboy';
        case 'Batch1': return 'kusonime';
        default: return alias;
    }
}
const sources = {
  otakudesu: sourcemap.otakudesu,
  oploverzac: sourcemap.oploverz,
  anoboy: sourcemap.anoboy,
  kusonime: sourcemap.kusonime,
};

async function test(primarySlug) {
    console.log(`Testing slug: ${primarySlug}`);
    
    let searchTitle = primarySlug.replace(/-/g, ' ').replace(/episode \d+/i, '').trim();
    console.log(`Initial search title: ${searchTitle}`);

    const overrides = {
        '1piece': 'one piece',
        'one piece': 'one piece'
    };
    Object.keys(overrides).forEach(key => {
        if (searchTitle.includes(key)) {
            searchTitle = searchTitle.replace(key, overrides[key]);
            console.log(`Override applied: ${searchTitle}`);
        }
    });
    
    searchTitle = searchTitle.replace(/sub indo/gi, '').replace(/subtitle indonesia/gi, '').trim();
    console.log(`Final search title: ${searchTitle}`);

    const searchPromises = STREAMING_PRIORITY.map(async (sourceName) => {
        try {
            // Mapping check
            let sourceKey = sourceName; // e.g., otakudesu
            const source = sources[sourceKey];
            if (!source) return null;
            
            console.log(`Searching ${sourceName}...`);
            const data = await source.search(searchTitle);
            if (data && data.results) {
                console.log(`[${sourceName}] Found ${data.results.length} results`);
                return { source: sourceName, results: data.results };
            }
        } catch (e) { console.error(e.message); }
        return null;
    });

    const searchResults = await Promise.all(searchPromises);
    
    // Check matching
    const normalize = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = normalize(searchTitle);
    
    console.log(`Target Norm: ${targetNorm}`);

    searchResults.forEach(sr => {
        if (!sr) return;
        const best = sr.results.find(r => {
            const rNorm = normalize(r.title);
            const match = rNorm.includes(targetNorm) || targetNorm.includes(rNorm);
            if (match) console.log(`Match found in ${sr.source}: ${r.title} (${r.slug})`);
            return match;
        });
    });
}

test('1piece-sub-indo');
