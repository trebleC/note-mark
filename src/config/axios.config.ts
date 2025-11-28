import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

// 从环境变量读取代理配置
const HTTP_PROXY = process.env.HTTP_PROXY || process.env.http_proxy;
const HTTPS_PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;

console.log('[Axios] 环境变量检查:', {
  HTTP_PROXY,
  HTTPS_PROXY,
  NODE_ENV: process.env.NODE_ENV
});

// 创建 axios 实例
const axiosInstance = axios.create({
  timeout: 60000, // 60秒超时
});

// 如果配置了代理，则使用代理
if (HTTP_PROXY || HTTPS_PROXY) {
  const proxyUrl = HTTPS_PROXY || HTTP_PROXY;
  console.log(`[Axios] 使用代理: ${proxyUrl}`);
  
  const httpsAgent = new HttpsProxyAgent(proxyUrl);
  const httpAgent = new HttpProxyAgent(proxyUrl);
  
  axiosInstance.defaults.proxy = false; // 禁用默认代理
  axiosInstance.defaults.httpsAgent = httpsAgent;
  axiosInstance.defaults.httpAgent = httpAgent;
} else {
  console.log('[Axios] 未配置代理，直连');
}

export default axiosInstance;
