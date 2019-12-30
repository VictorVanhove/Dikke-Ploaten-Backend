const mongoose = require('mongoose');

/**
 * Album Schema
 */
let AlbumSchema = new mongoose.Schema({
    title: { required: true, type: String },
    artist: { required: true, type: String },
    thumb: { required: true, type: String },
    description: { required: true, type: String },
    genre: { required: true, type: String },
    released_in: { required: true, type: String },
    tracklist: { required: true, type: String },
    musicians: { required: false, type: String },
    images: { required: true, type: Array }
});

module.exports = mongoose.model("Album", AlbumSchema);
