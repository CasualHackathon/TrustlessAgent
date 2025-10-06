/**
 * 项目提交信息提取脚本
 * Submission information extraction script
 * 
 * 用于处理 GitHub Issue 中的项目提交信息，创建项目文件夹并更新 README 表格
 */

const SubmissionProcessor = require('./processors/submission-processor');

// 从环境变量获取参数
const issueBody = process.env.ISSUE_BODY || `ProjectName[项目名称]:projectName

Brief description about your project in one sentence（简要描述您的项目）
ProjectDescription[项目描述]:ProjectDescription

Your wallet address or ENS domain on Ethereum mainnet（您在以太坊主网上的钱包地址或 ENS 域名）
WalletAddress[钱包地址]:test.eth`;

const githubUser = process.env.ISSUE_USER || 'githubUser';

// 调试输出
console.log('处理用户:', githubUser);
console.log('Issue 内容:\n', issueBody);

try {
    // 处理项目提交
    SubmissionProcessor.processSubmission(issueBody, githubUser);
} catch (error) {
    console.error('项目提交处理失败:', error.message);
    process.exit(1);
}