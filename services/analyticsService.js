const axios = require("axios"); 
const { InstagramAnalytics, YouTubeAnalytics } = require("../models/PlatformAnalytics");

async function fetchInstagramAnalytics() {
    // TODO
}

async function fetchYouTubeAnalytics(accessToken, videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&access_token=${accessToken}`;
    
    try {
        const response = await axios.get(url);
        const video = response.data.items[0];
        
        return new YouTubeAnalytics({
            views: video.statistics.viewCount,
            likes: video.statistics.likeCount,
            comments: video.statistics.commentCount,
            shares: 0, // TODO 
            amountMade: 0,
            customNodes: {},
            isSponsored: false,
        });
    } catch (error) {
        console.error("Error fetching YouTube analytics:", error);
        return {};
    }
}

module.exports = { fetchInstagramAnalytics, fetchYouTubeAnalytics }; 
