class SessionState { //clase abstracta que representa el estado de la sesion
    stageName() {
        throw new Error("Subclass must implement stageName()");
    }
    submit(session, paper) {
        throw new Error("Cannot submit papers in " + this.stageName() + " stage");
    }
    canSubmit(session, paper) {
        return false;
    }
    addReviewer(session, user) {
        throw new Error("Cannot add reviewers in " + this.stageName() + " stage");
    }
    closeSubmissions(session) {
        throw new Error("Cannot close submissions in " + this.stageName() + " stage");
    }
    enterBid(session, paper, reviewer, interest) {
        throw new Error("Cannot enter bids in " + this.stageName() + " stage");
    }
    closeBidding(session) {
        throw new Error("Cannot close bidding in " + this.stageName() + " stage");
    }
    addReview(session, paper, reviewer, text, score) {
        throw new Error("Cannot add reviews in " + this.stageName() + " stage");
    }
    assignedReviewersFor(session, paper) {
        throw new Error("Cannot query assigned reviewers in " + this.stageName() + " stage");
    }
    closeReviewing(session) {
        throw new Error("Cannot close reviewing in " + this.stageName() + " stage");
    }
    acceptedPapers(session) {
        throw new Error("Cannot query accepted papers in " + this.stageName() + " stage");
    }
}

module.exports = SessionState;
