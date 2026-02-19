try {
    const { RandomForestRegression } = require('ml-random-forest');
    console.log("ml-random-forest loaded successfully");
} catch (error) {
    console.error("Failed to load ml-random-forest:", error);
    process.exit(1);
}
