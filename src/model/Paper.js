const Review = require("./Review");

class Paper{
    constructor(title, authors, correspondingAuthor){
        if(!authors.includes(correspondingAuthor)) throw new Error("Corresponding author must be an author");
        this._title = title;
        this._reviews = [];
        this._assignedReviewers = [];
        this._authors = authors;
        this._correspondingAuthor = correspondingAuthor;
    }
    title(){
        return this._title;
    }
    authors(){
        return this._authors;
    }
    reviews(){
        return this._reviews;
    }
    assignedReviewers(){
        return this._assignedReviewers;
    }
    addAssignedReviewer(reviewer){
        this._assignedReviewers.push(reviewer);
    }
    isValid(){
        return (this._title !== "") && (this._authors.length > 0);
    }
    addReview(reviewer, text, score){
        if(!this._assignedReviewers.includes(reviewer)){
            throw new Error("Reviewer is not assigned to this paper");
        }
        if(this._reviews.some(function(review){ return review.reviewer() === reviewer; })){
            throw new Error("Reviewer already submitted a review for this paper");
        }
        if(this.reviewsCount() >= this.constructor.allowedReviews){
            throw new Error("Cannot allow any more reviews");
        }
        this._reviews.push(new Review(reviewer, text, score));
    }
    reviewsCount(){
        return this.reviews().length;
    }
    score(){
        if (this.reviewsCount() > 0){
            let sum = this.reviews().reduce( (partialSum, review) => partialSum + review.score(), 0 );
            return sum / this.reviewsCount();
        }
        else 
            return 0;
    }
}

Paper.allowedReviews = 3;

module.exports = Paper;