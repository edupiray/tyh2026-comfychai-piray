const SessionState = require("./SessionState");

class ReceivingState extends SessionState {
    stageName() {
        return "Receiving";
    }
    canSubmit(session, paper) {
        return paper.isValid();
    }
    submit(session, paper) {
        if (!this.canSubmit(session, paper)) throw new Error("Cannot submit invalid paper");
        session._papers.push(paper);
    }
    addReviewer(session, user) {
        session._programCommittee.push(user);
    }
    closeSubmissions(session) {
        const BiddingState = require("./BiddingState");
        return new BiddingState();
    }
}

module.exports = ReceivingState;
