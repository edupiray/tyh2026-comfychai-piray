const SessionState = require("./SessionState");

class SelectionState extends SessionState {
    stageName() {
        return "Selection";
    }
    acceptedPapers(session) {
        return session._acceptedPapers;
    }
    assignedReviewersFor(session, paper) {
        return paper.assignedReviewers();
    }
}

module.exports = SelectionState;
