const SessionState = require("./SessionState");
const {Bid} = require("../model/Bid");

class BiddingState extends SessionState {
    stageName() {
        return "Bidding";
    }
    enterBid(session, paper, reviewer, interest) {
        if (session._bidExistsFor(paper, reviewer)) {
            const existing = session._bidFor(paper, reviewer);
            existing.setInterest(interest);
        } else {
            const bid = new Bid(paper, reviewer, interest);
            session._bids.push(bid);
        }
    }
    closeBidding(session) {
        session._assignReviewers();
        const AssignmentState = require("./AssignmentState");
        return new AssignmentState();
    }
}

module.exports = BiddingState;
