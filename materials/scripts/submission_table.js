/**
 * 提交状态表格更新脚本
 * Submission status table update script
 * 
 * 用于更新 README.md 中的项目提交状态表格
 */

const SubmissionProcessor = require('./processors/submission-processor');

/**
 * 更新提交表格
 */
function updateSubmissionTable() {
    try {
        console.log('开始更新提交表格...');
        SubmissionProcessor.updateSubmissionTable();
        console.log('提交表格更新完成');
    } catch (error) {
        console.error('更新提交表格失败:', error.message);
        throw error;
    }
}

// 如果作为主程序运行，直接执行更新
if (require.main === module) {
    updateSubmissionTable();
}

module.exports = { updateSubmissionTable };