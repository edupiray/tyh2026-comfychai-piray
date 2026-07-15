const Paper = require("./Paper");

class RegularPaper extends Paper{ //clase que representa un paper regular, con su título, autores, autor correspondiente, reviews y revisores asignados, además de un abstract
    constructor(title, authors, correspondingAuthor, abstract){
        super(title, authors, correspondingAuthor);
        this._abstract = abstract;
    }
    abstract(){
        return this._abstract;
    }
    setAbstract(abstract){
        this._abstract = abstract;
    }
    abstractWordCount(){
        return this._abstract.trim().split(/\s+/).length;
    }
    isValid(){
        return super.isValid() && (this.abstractWordCount() <= 300)
    }
}

module.exports = RegularPaper;