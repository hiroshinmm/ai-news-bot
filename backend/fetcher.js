import Parser from 'rss-parser';

const parser = new Parser();

// RSSフィードのURLリスト（AI関連のニュースソース）
const FEEDS = [
    { name: 'Google News (AI)', url: 'https://news.google.com/rss/search?q=AI+OR+%E4%BA%BA%E5%B7%A5%E7%9F%A5%E8%83%BD&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'ITmedia AI+', url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml' }, // AI専用RSSがないため総合、後でフィルタ
    { name: 'Zenn (Machine Learning)', url: 'https://zenn.dev/topics/machinelearning/feed' },
    { name: 'Zenn (AI)', url: 'https://zenn.dev/topics/ai/feed' }
];

/**
 * Google NewsのリンクからオリジナルのURLを抽出する（Base64デコード）
 */
function decodeGoogleNewsUrl(encodedUrl) {
    if (!encodedUrl.includes('news.google.com')) return encodedUrl;
    try {
        const urlObj = new URL(encodedUrl);
        const pathParts = urlObj.pathname.split('/');
        const base64Str = pathParts[pathParts.length - 1];

        // Base64デコード（binaryとして読み込む）
        const decoded = Buffer.from(base64Str, 'base64').toString('binary');

        // "http" 以降の文字列を抽出
        const start = decoded.indexOf('http');
        if (start === -1) return encodedUrl;

        let url = decoded.substring(start);

        // 制御文字やバイナリゴミを除去（URLとして有効な文字範囲のみを抽出）
        const match = url.match(/[^\x20-\x7E]/);
        if (match) {
            url = url.substring(0, match.index);
        }

        return url;
    } catch (e) {
        return encodedUrl;
    }
}

/**
 * オンラインでリダイレクトを追跡してURLを解決する（フォールバック）
 */
async function resolveUrlOnline(googleUrl) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

        const response = await fetch(googleUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        clearTimeout(timeout);

        const text = await response.text();

        // メタリフレッシュや特定の要素からURLを抽出
        const refreshMatch = text.match(/url=(http[^"]+)"/i);
        if (refreshMatch) return refreshMatch[1];

        const dataUrlMatch = text.match(/data-url="([^"]+)"/);
        if (dataUrlMatch) return dataUrlMatch[1];

        // 最終手段：google以外のそれっぽいリンクを探す
        const links = text.match(/https?:\/\/[^\s"'<>]+/g);
        if (links) {
            const realLink = links.find(l =>
                !l.includes('google.com') &&
                !l.includes('gstatic.com') &&
                l.length > 30
            );
            if (realLink) return realLink;
        }

        return googleUrl;
    } catch (e) {
        return googleUrl;
    }
}

async function parseFeedWithRetry(url, maxRetries = 2) {
    let delay = 3000;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await parser.parseURL(url);
        } catch (error) {
            if (attempt <= maxRetries) {
                console.warn(`  ⚠️ Retry ${attempt}/${maxRetries} in ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
                delay *= 2;
            } else {
                throw error;
            }
        }
    }
}

export async function fetchNews() {
    console.log('📰 Fetching news from RSS feeds...');
    const feedResults = await Promise.allSettled(FEEDS.map(async (feed) => {
        console.log(`- Fetching: ${feed.name}`);
        const fetchedFeed = await parseFeedWithRetry(feed.url);

        return Promise.all(fetchedFeed.items.map(async (item) => {
            let link = decodeGoogleNewsUrl(item.link);

            // デコードに失敗し（＝元のURLが取れず）、かつGoogle Newsのリンクのままの場合のみオンライン解決を試みる
            if (link.includes('news.google.com')) {
                link = await resolveUrlOnline(link);
            }

            return {
                source: feed.name,
                title: item.title,
                link: link,
                pubDate: item.pubDate,
                contentSnippet: item.contentSnippet || item.content || ''
            };
        }));
    }));

    const allNews = [];
    feedResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allNews.push(...result.value);
            return;
        }

        console.error(`❌ Error fetching ${FEEDS[index].name}:`, result.reason?.message || result.reason);
    });

    // 重複を削除し、最新順にソート
    const uniqueNews = Array.from(new Map(allNews.map(item => [item.link, item])).values());
    uniqueNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    console.log(`✅ Total ${uniqueNews.length} articles fetched.`);

    // 直近24時間のニュースに絞る（または上位N件取得）などの処理を入れることも可能
    // 今回は全件からAIによって選別させるため、最新50件程度に絞っておく
    return uniqueNews.slice(0, 50);
}

// 単体テスト用
if (process.argv[1] === new URL(import.meta.url).pathname) {
    fetchNews().then(news => {
        console.log(`Found ${news.length} articles.`);
        console.log('Sample URL (first 3):');
        news.slice(0, 3).forEach(n => console.log(`- ${n.title}\n  Link: ${n.link}`));
    });
}
