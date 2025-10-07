/**
 * 通用字段解析工具
 * Common field parsing utilities for issue body and file content
 */


/**
 * 从文件内容中解析指定字段
 * @param {string} content - 文件内容
 * @param {string} fieldName - 字段名称
 * @returns {string} 字段值
 */
function parseFieldFromContent(content, fieldName) {
    const lines = content.split('\n');
    const pattern = `**${fieldName}**`;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // 匹配 **FieldName** 或 **FieldName** (description) 格式
        if (line.includes(pattern) && line.startsWith('**')) {
            // 检查当前行是否包含值（格式：**Field** value）
            // 但排除包含括号描述的情况
            if (!line.includes('(') || line.includes(')') && !line.includes('(')) {
                const value = line.slice(pattern.length).replace(/\s+$/, '').trim();
                if (value) {
                    return value;
                }
            }

            // 新格式：字段名在一行，值在下一行
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();

                // 跳过空行
                if (!nextLine) {
                    continue;
                }

                // 检查是否是 > 格式的值
                if (nextLine.startsWith('>')) {
                    return nextLine.substring(1).trim();
                }
                // 检查是否是普通的值行
                else if (!nextLine.startsWith('**') && !nextLine.startsWith('*') && !nextLine.startsWith('#') && nextLine !== '---') {
                    return nextLine;
                }
            }
        }
    }

    return '';
}

module.exports = {
    parseFieldFromContent
};