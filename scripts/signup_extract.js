/**
 * 注册信息提取脚本
 * Registration information extraction script
 * 
 * 用于处理 GitHub Issue 中的注册信息，创建用户注册文件并更新 README 表格
 */

const RegistrationProcessor = require('./processors/registration-processor');

// 从环境变量获取参数
const issueBody = process.env.ISSUE_BODY || `Name[姓名]:name

Brief personal introduction including skills and experience (One sentence)[简短介绍个人技能与经验]
Description[个人介绍]:description

Telegram | WeChat | Discord | Email | X(Twitter) | GitHub
ContactMethod[联系方式]:contactMethod

e.g., @username, email@example.com
Contact[联系账号]:contact22`;

const githubUser = process.env.ISSUE_USER || 'githubUser';

// 调试输出
console.log('处理用户:', githubUser);
console.log('Issue 内容:\n', issueBody);

try {
    // 处理注册
    RegistrationProcessor.processRegistration(issueBody, githubUser);
} catch (error) {
    console.error('注册处理失败:', error.message);
    process.exit(1);
}