/**
 * 抖音评论爬取
 * @Author : lihuiwen
 * @Email : huiwennear@163.com
 * @Time : 2024/5/23 16:58
 */

import CommonUtils from './utils/commonUtils.js';
import axios from 'axios';
import https from 'https';

// 禁用 SSL 证书验证（仅用于开发环境）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

class DyComment {
  constructor() {
    this.commonUtils = new CommonUtils();
    this.commentListHeaders = {
      'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua-mobile': '?0',
      'User-Agent': this.commonUtils.userAgent,
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };
  }

  async getCommentList(reqUrl) {
    let awemeId;
    
    // 从 URL 中提取 aweme_id
    if (reqUrl.includes('modal_id')) {
      const urlObj = new URL(reqUrl);
      awemeId = urlObj.searchParams.get('modal_id');
    } else {
      const urlObj = new URL(reqUrl);
      const pathParts = urlObj.pathname.split('/');
      awemeId = pathParts[pathParts.length - 1];
    }

    const refererUrl = `https://www.douyin.com/discover?modal_id=${awemeId}`;
    const msToken = this.commonUtils.getMsToken();
    const [ttwidStr, webid] = await this.commonUtils.getTtwidWebid(refererUrl);

    const commentListReqUrl = `https://www.douyin.com/aweme/v1/web/comment/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&aweme_id=${awemeId}&cursor=0&count=20&item_type=0&insert_ids=&whale_cut_token=&cut_version=1&rcFT=&update_version_code=170400&pc_client_type=1&version_code=170400&version_name=17.4.0&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=123.0.0.0&browser_online=true&engine_name=Blink&engine_version=123.0.0.0&os_name=Windows&os_version=10&cpu_core_num=16&device_memory=8&platform=PC&downlink=10&effective_type=4g&round_trip_time=50&webid=${webid}&verifyFp=verify_lwg2oa43_Ga6DRjOO_v2cd_4NL7_AHTp_qMKyKlDdoqra&fp=verify_lwg2oa43_Ga6DRjOO_v2cd_4NL7_AHTp_qMKyKlDdoqra&msToken=${msToken}`;

    const headers = {
      ...this.commentListHeaders,
      'Referer': refererUrl,
      'Cookie': `ttwid=${ttwidStr};`
    };

    const abogus = this.commonUtils.getAbogus(commentListReqUrl, this.commonUtils.userAgent);
    const url = commentListReqUrl + '&a_bogus=' + abogus;

    try {
      const response = await axios.get(url, {
        headers,
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
                     (process.argv[1] && process.argv[1].includes('douyin_crawler.js'));

if (isMainModule) {
  const reqUrl = 'https://www.douyin.com/discover?modal_id=7258913772092296485';
  const dyComment = new DyComment();
  dyComment.getCommentList(reqUrl).catch(console.error);
}

export default DyComment;

