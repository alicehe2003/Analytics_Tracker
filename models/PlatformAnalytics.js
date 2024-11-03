// abstract PlatformAnalytics class 
class PlatformAnalytics {
    constructor({ views, likes, comments, shares, amountMade, customNotes, isSponsored }) {
        if (new.target === PlatformAnalytics) {
            throw new TypeError("Cannot instantiate abstract class PlatformAnalytics."); 
        }
        this.views = views || 0; 
        this.likes = likes || 0; 
        this.comments = comments || {}; 
        this.shares = shares || 0; 
        this.amountMade = amountMade || 0; 
        this.customNotes = customNotes || {}; 
        this.isSponsored = isSponsored || false; 
    }
}

// Instagram analytics 
class InstagramAnalytics extends PlatformAnalytics {
    constructor(data) {
        super(data); 
    }
}

// YouTube analytics 
class YouTubeAnalytics extends PlatformAnalytics {
    constructor(data) {
        super(data); 
    }
}

// other analytics - for platforms without built-in support 
class OtherAnalytics extends PlatformAnalytics {
    constructor(data, customPlatformName) {
        super(data); 
        this.customPlatformName = customPlatformName; 
    }
}

module.exports = { PlatformAnalytics, InstagramAnalytics, YouTubeAnalytics, OtherAnalytics };
