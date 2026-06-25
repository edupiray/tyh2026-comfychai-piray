const SessionState = require("./SessionState");

class AssignmentState extends SessionState {
    stageName() {
        return "Assignment";
    }
    addReview(session, paper, reviewer, text, score) {
        if (!this.assignedReviewersFor(session, paper).includes(reviewer)) {
            throw new Error("Reviewer is not assigned to this paper");
        }
        if (paper.reviews().some(function(review) { return review.reviewer() === reviewer; })) {
            throw new Error("Reviewer already submitted a review for this paper");
        }
        if (!Number.isInteger(score) || score < -3 || score > 3) {
            throw new Error("Score must be an integer between -3 and +3");
        }
        paper.addReview(reviewer, text, score);
    }
    assignedReviewersFor(session, paper) {
        return session._assignments.get(paper) || [];
    }
    closeReviewing(session) {
        if (!session._acceptancePolicy) {
            throw new Error("No acceptance policy has been set");
        }
        session._acceptedPapers = session._acceptancePolicy.select(session._papers);
        const SelectionState = require("./SelectionState");
        return new SelectionState();
    }
}

module.exports = AssignmentState;
