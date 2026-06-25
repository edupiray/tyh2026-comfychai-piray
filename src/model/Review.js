class Review{
    constructor(reviewer, text, score){
        if(!Number.isInteger(score) || score < -3 || score > 3){
            throw new Error("Score must be an integer between -3 and +3");
        }
        this._reviewer = reviewer;
        this._text = text;
        this._score = score;
    }
    reviewer(){
        return this._reviewer;
    }
    text(){
        return this._text;
    }
    score(){
        return this._score;
    }

}

module.exports = Review;