const SessionState = require("./SessionState");

class SelectionState extends SessionState {
    stageName() {
        return "Selection";
    }
    acceptedPapers(session) {
        return session._acceptedPapers;
    }
    assignedReviewersFor(session, paper) {
        return session._assignments.get(paper) || [];
    }
}

module.exports = SelectionState;
