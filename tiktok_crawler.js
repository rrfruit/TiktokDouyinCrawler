/**
 * TikTok评论爬取
 * @Author : lihuiwen
 * @Email : huiwennear@163.com
 * @Time : 2024/5/23 16:59
 */

import CommonUtils from './utils/commonUtils.js';
import axios from 'axios';
import https from 'https';

// 禁用 SSL 证书验证（仅用于开发环境）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

class TiktokComment {
  constructor() {
    this.commonUtils = new CommonUtils();
    this.commentListHeaders = {
      'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'sec-ch-ua-mobile': '?0',
      'User-Agent': this.commonUtils.userAgent,
      'sec-ch-ua-platform': '"Windows"',
      'Accept': '*/*',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };
  }

  async getCommentList(reqUrl) {
    const urlObj = new URL(reqUrl);
    const pathParts = urlObj.pathname.split('/');
    const awemeId = pathParts[pathParts.length - 1];

    const msToken = this.commonUtils.getMsToken();
    let reqUrlWithParams = `https://www.tiktok.com/api/comment/list/?WebIdLastTime=1715249710&aid=1988&app_language=ja-JP&app_name=tiktok_web&aweme_id=${awemeId}&browser_language=zh-CN&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F123.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&count=20&current_region=JP&cursor=0&device_id=7366941338308609569&device_platform=web_pc&enter_from=tiktok_web&focus_state=true&fromWeb=1&from_page=video&history_len=2&is_fullscreen=false&is_non_personalized=false&is_page_visible=true&odinId=7367172442253296673&os=windows&priority_region=&referer=&region=GB&screen_height=1080&screen_width=1920&tz_name=Asia%2FShanghai&webcast_language=zh-Hans&msToken=${msToken}`;

    const xbogus = this.commonUtils.getXbogus(reqUrlWithParams, this.commonUtils.userAgent);
    reqUrlWithParams = reqUrlWithParams + `&X-Bogus=${xbogus}&_signature=_02B4Z6wo000016M20awAAIDAnp.LMKuZmC-jNtUAAI6L17`;

    try {
      const response = await axios.get(reqUrlWithParams, {
        headers: this.commentListHeaders,
        httpsAgent,
        timeout: 3000,
        validateStatus: () => true
      });

      if (response.data) {
        const reqJson = response.data;
        const total = reqJson.total;
        const comments = reqJson.comments;

        if (comments && comments.length > 0) {
          for (const commentItem of comments) {
            const nickname = commentItem?.user?.nickname || '未知用户';
            const text = commentItem?.text || '无内容';
            console.log(`爬取成功：${nickname}：${text}`);
          }
        } else {
          console.log(`爬取结束：评论数=${total}`);
        }
      } else {
        console.log('爬取失败或没有评论');
      }
    } catch (error) {
      console.error('请求失败:', error.message);
    }
  }
}

// 主函数 - 检查是否是直接运行此文件
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     (process.argv[1] && process.argv[1].includes('tiktok_crawler.js'));

if (isMainModule) {
  const reqUrl = 'https://www.tiktok.com/@.jisvnq/video/7341777664224677153';
  const tiktokComment = new TiktokComment();
  tiktokComment.getCommentList(reqUrl).catch(console.error);
}

export default TiktokComment;

