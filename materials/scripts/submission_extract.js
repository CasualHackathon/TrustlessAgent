/**
 * Submission information extraction script
 * 
 * Used to process project submission information from GitHub Issues, create project folders and update README table
 */

const SubmissionProcessor = require('./processors/submission-processor');

// Get parameters from environment variables
const issueBody = process.env.ISSUE_BODY;

const githubUser = process.env.ISSUE_USER;

// Debug output
console.log('Processing user:', githubUser);
console.log('Issue content:\n', issueBody);

try {
    // Process project submission
    SubmissionProcessor.processSubmission(issueBody, githubUser);
} catch (error) {
    console.error('Project submission processing failed:', error.message);
    process.exit(1);
}