const SessionState = require("./SessionState");

class AssignmentState extends SessionState {
    stageName() {
        return "Assignment";
    }
    addReview(session, paper, reviewer, text, score) {
        paper.addReview(reviewer, text, score);
    }
    assignedReviewersFor(session, paper) {
        return paper.assignedReviewers();
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
