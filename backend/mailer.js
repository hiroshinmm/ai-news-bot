import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export async function sendEmailWithNews(newsData) {
    const { GMAIL_USER, GMAIL_PASS } = process.env;

    if (!GMAIL_USER || !GMAIL_PASS) {
        console.error('❌ Gmail credentials are not set in .env file.');
        return false;
    }

    if (!newsData || !newsData.headlines) {
        console.error('❌ Invalid or empty news data provided for email.');
        return false;
    }

    console.log(`📧 Preparing to send email to ${GMAIL_USER}...`);

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_PASS
        }
    });

    // メールのHTMLコンテンツを生成
    let htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px;">Daily AI News Summary</h1>
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://hiroshinmm.github.io/ai-news-bot/" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">🌐 Webサイトで最新ニュースを見る</a>
        </div>
        <p style="text-align: right; color: #7f8c8d; font-size: 0.9em;">Generated at: ${new Date(newsData.generatedAt).toLocaleString('ja-JP')}</p>

        <h2 style="color: #2980b9; margin-top: 30px; border-left: 5px solid #3498db; padding-left: 10px;">🌟 ヘッドライン（要約）</h2>
    `;

    newsData.headlines.forEach((news, idx) => {
        htmlContent += `
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h3 style="margin-top: 0; color: #2c3e50; font-size: 1.2rem;">${idx + 1}. <a href="${news.link}" style="color: #3498db; text-decoration: none;">${news.title}</a></h3>
            <p style="margin: 10px 0; font-size: 1.05rem; line-height: 1.7;">${news.summary}</p>
            <p style="margin-bottom: 0; color: #7f8c8d; font-size: 0.85rem;">ソース: ${news.source} | 日付: ${new Date(news.pubDate).toLocaleString('ja-JP')}</p>
        </div>
        `;
    });

    htmlContent += `
        <h2 style="color: #16a085; margin-top: 40px; border-left: 5px solid #1abc9c; padding-left: 10px;">📰 次点の注目ニュース（10件）</h2>
        <ul style="list-style-type: none; padding-left: 0;">
    `;

    if (newsData.subNews && newsData.subNews.length > 0) {
        newsData.subNews.forEach(news => {
            htmlContent += `
            <li style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #eaeaea;">
                <a href="${news.link}" style="color: #2c3e50; text-decoration: none; font-size: 1.05em; font-weight: bold;">${news.title}</a>
                ${news.summary ? `<p style="margin: 6px 0; color: #555; font-size: 0.95em;">${news.summary}</p>` : ''}
                <span style="display: block; color: #7f8c8d; font-size: 0.85em; margin-top: 4px;">ソース: ${news.source} | 日付: ${new Date(news.pubDate).toLocaleString('ja-JP')}</span>
            </li>
            `;
        });
    } else {
        htmlContent += `<li>該当のニュースがありませんでした。</li>`;
    }

    htmlContent += `</ul>`;

    htmlContent += `
        <h2 style="color: #8e44ad; margin-top: 40px; border-left: 5px solid #9b59b6; padding-left: 10px;">🔍 その他のニュースリスト一覧</h2>
        <ul style="list-style-type: none; padding-left: 0; font-size: 0.9em;">
    `;

    if (newsData.otherNews && newsData.otherNews.length > 0) {
        newsData.otherNews.forEach(news => {
            htmlContent += `
            <li style="margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0;">
                📝 <a href="${news.link}" style="color: #34495e; text-decoration: none; font-weight: bold;">${news.title}</a>
                <span style="color: #95a5a6; font-size: 0.8em; margin-left: 5px;">(${news.source})</span>
                ${news.summary ? `<p style="margin: 4px 0 0 25px; color: #666; font-size: 0.9em;">${news.summary}</p>` : ''}
            </li>
            `;
        });
    } else {
        htmlContent += `<li>該当のニュースがありませんでした。</li>`;
    }

    htmlContent += `
        </ul>
        <div style="margin-top: 40px; text-align: center; border-top: 2px solid #eee; padding-top: 20px;">
            <a href="https://hiroshinmm.github.io/ai-news-bot/" style="color: #3498db; font-weight: bold; font-size: 1.1em; text-decoration: none;">ニュースダッシュボード (Web) を開く</a>
            <p style="color: #7f8c8d; font-size: 0.9em; margin-top: 15px;">このメールは、AIニュース収集システムから自動送信されています。</p>
        </div>
    </div>
    `;

    let mailOptions = {
        from: GMAIL_USER, // 自分のアドレスから
        to: GMAIL_USER,   // 自分のアドレスへ
        subject: `Daily AI News Summary - ${new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
        html: htmlContent
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.response);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
}
