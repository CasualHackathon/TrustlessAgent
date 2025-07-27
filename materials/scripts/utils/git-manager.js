const { execSync } = require('child_process');

/**
 * Git 操作工具类
 * Git operations utilities
 */
class GitManager {
    /**
     * 配置 Git 用户信息
     */
    static configureGitUser() {
        try {
            execSync('git config --local user.email "action@github.com"', { stdio: 'inherit' });
            execSync('git config --local user.name "GitHub Action"', { stdio: 'inherit' });
        } catch (error) {
            console.error('Git 用户配置失败:', error.message);
            throw error;
        }
    }

    /**
     * 添加文件到 Git 暂存区
     * @param {...string} filePaths - 文件路径
     */
    static addFiles(...filePaths) {
        try {
            const filePathsString = filePaths.join(' ');
            execSync(`git add ${filePathsString}`, { stdio: 'inherit' });
        } catch (error) {
            console.error('添加文件到暂存区失败:', error.message);
            throw error;
        }
    }

    /**
     * 检查是否有变更需要提交
     * @returns {boolean} 是否有变更
     */
    static hasChangesToCommit() {
        try {
            execSync('git diff --cached --quiet');
            return false; // 没有变更
        } catch {
            return true; // 有变更
        }
    }

    /**
     * 提交变更
     * @param {string} message - 提交信息
     */
    static commitChanges(message) {
        try {
            if (!this.hasChangesToCommit()) {
                console.log('没有需要提交的更改');
                return;
            }

            // 正确转义提交信息
            const escapedMessage = message.replace(/["\\$`]/g, '\\$&');
            execSync(`git commit -m "${escapedMessage}"`, { stdio: 'inherit' });
            execSync('git push', { stdio: 'inherit' });
            console.log('提交成功');
        } catch (error) {
            console.error('提交失败:', error.message);
            // 输出更详细的错误信息
            if (error.status) {
                console.error('退出代码:', error.status);
            }
            if (error.stderr) {
                console.error('错误输出:', error.stderr.toString());
            }
            throw error;
        }
    }

    /**
     * 完整的提交流程：配置用户 -> 添加文件 -> 提交
     * @param {string} commitMessage - 提交信息
     * @param {...string} filePaths - 文件路径
     */
    static commitWorkflow(commitMessage, ...filePaths) {
        this.configureGitUser();
        this.addFiles(...filePaths);
        this.commitChanges(commitMessage);
    }
}

module.exports = GitManager;