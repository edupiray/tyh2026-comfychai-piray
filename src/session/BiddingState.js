const SessionState = require("./SessionState");
const {Bid} = require("../model/Bid");

class BiddingState extends SessionState { //clase que representa el estado de la sesion en la etapa de Bidding
    stageName() {
        return "Bidding";
    }
    enterBid(session, paper, reviewer, interest) { //lo revisores expresan su interes por un paper
        if (session._bidExistsFor(paper, reviewer)) {
            const existing = session._bidFor(paper, reviewer);
            existing.setInterest(interest);
        } else {
            const bid = new Bid(paper, reviewer, interest);
            session._bids.push(bid);
        }
    }
    closeBidding(session) {
        session._assignReviewers(); //asigno revisores a papers según los bids ingresados
        const AssignmentState = require("./AssignmentState");
        session.setState(new AssignmentState()); //avanzo al siguiente estado: Asignación de revisores
    }
}

module.exports = BiddingState;
