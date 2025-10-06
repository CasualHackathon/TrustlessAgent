/**
 * 通用字段解析工具
 * Common field parsing utilities for issue body and file content
 */

/**
 * 解析 Issue Body 中的字段
 * @param {string} bodyString - Issue body 内容
 * @returns {Object} 解析后的字段对象
 */
function parseIssueFields(bodyString) {
    const cleanBody = bodyString
        .split('\n')
        .map(line => line.trim())
        .join('\n');

    const lines = cleanBody.split('\n');
    const fields = {};

    // 提取所有 **Field Name** 格式的字段名
    const fieldNames = [];
    const fieldValues = [];

    // 先收集所有字段名（排除指令行）
    for (const line of lines) {
        // 匹配 **Field Name** (description) 格式，但排除指令行
        const match = line.match(/^\*\*(.+?)\*\*\s*\([^)]+\)$/);
        if (match && !line.includes('Instructions') && !line.includes('Example')) {
            fieldNames.push(match[1].trim());
        }
    }

    // 再收集所有 > 格式的值（排除指令行）
    for (const line of lines) {
        if (line.startsWith('>') && !line.includes('Instructions') && !line.includes('Example') && !line.includes('**')) {
            fieldValues.push(line.substring(1).trim());
        }
    }

    // 按索引一一对应
    for (let i = 0; i < Math.min(fieldNames.length, fieldValues.length); i++) {
        fields[fieldNames[i]] = fieldValues[i];
    }

    // 兼容旧格式: Field[中文]: 或 Field:
    for (const line of lines) {
        const colonIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('：');
        if (colonIndex !== -1 && !line.startsWith('**')) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            if (value && !fields[key]) {
                fields[key] = value;
            }
        }
    }

    return fields;
}

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
    parseIssueFields,
    parseFieldFromContent
};