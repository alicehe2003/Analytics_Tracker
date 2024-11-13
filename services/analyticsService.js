const axios = require("axios"); 
const { InstagramAnalytics, YouTubeAnalytics } = require("../models/PlatformAnalytics");

async function fetchInstagramAnalytics() {
    // TODO
}

async function fetchYouTubeAnalytics(accessToken, videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos`;
    
    try {
        const response = await axios.get(url, {
            params: {
                part: 'statistics',
                id: videoId,
                access_token: accessToken
            }
        });
        
        // Check if items exist in the response
        if (response.data.items && response.data.items.length > 0) {
            const video = response.data.items[0];
            const statistics = video.statistics;
            
            // Convert string values to numbers and handle undefined values
            return new YouTubeAnalytics({
                views: parseInt(statistics.viewCount) || 0,
                likes: parseInt(statistics.likeCount) || 0,
                comments: parseInt(statistics.commentCount) || 0,
                shares: 0,
                amountMade: 0,
                customNotes: {},
                isSponsored: false,
            });
        } else {
            throw new Error('No data found for the provided video ID');
        }
    } catch (error) {
        throw new Error(`Failed to fetch YouTube analytics: ${error.message}`);
    }
}

module.exports = { fetchInstagramAnalytics, fetchYouTubeAnalytics }; 
