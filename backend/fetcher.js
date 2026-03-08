import Parser from 'rss-parser';

const parser = new Parser();

// RSSフィードのURLリスト（AI関連のニュースソース）
const FEEDS = [
    { name: 'Google News (AI)', url: 'https://news.google.com/rss/search?q=AI+OR+%E4%BA%BA%E5%B7%A5%E7%9F%A5%E8%83%BD&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'TechCrunch Japan (AI)', url: 'https://jp.techcrunch.com/category/artificial-intelligence/feed/' },
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

export async function fetchNews() {
    console.log('📰 Fetching news from RSS feeds...');
    let allNews = [];

    for (const feed of FEEDS) {
        try {
            console.log(`- Fetching: ${feed.name}`);
            const fetchedFeed = await parser.parseURL(feed.url);

            const articles = fetchedFeed.items.map(item => ({
                source: feed.name,
                title: item.title,
                link: decodeGoogleNewsUrl(item.link),
                pubDate: item.pubDate,
                contentSnippet: item.contentSnippet || item.content || ''
            }));

            allNews = allNews.concat(articles);
        } catch (error) {
            console.error(`❌ Error fetching ${feed.name}:`, error.message);
        }
    }

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
    fetchNews().then(news => console.log(`Found ${news.length} articles.`));
}
