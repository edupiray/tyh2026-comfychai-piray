const Paper = require("./Paper");

class Poster extends Paper{ //clase que representa un poster, con su título, autores, autor correspondiente, reviews y revisores asignados, además de la url del attachment y de los sources
    constructor(title, authors, correspondingAuthor, attachmentUrl, sourcesUrl){
        super(title, authors, correspondingAuthor);
        this._attachmentUrl = attachmentUrl;
        this._sourcesUrl = sourcesUrl;
    }
    attachmentUrl(){
        return this._attachmentUrl;
    }
    sourcesUrl(){
        return this._sourcesUrl;
    }
}

module.exports = Poster;
