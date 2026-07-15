const SessionState = require("./SessionState");

class ReceivingState extends SessionState { //estado de recepción de papers. Inicia la sesión en este estado. 
    stageName() {
        return "Receiving";
    }
    canSubmit(session, paper) {
        return paper.isValid();
    }
    submit(session, paper) { //envio de paper por parte de un autor
        if (!this.canSubmit(session, paper)) throw new Error("Cannot submit invalid paper");
        session._papers.push(paper);
    }
    addReviewer(session, user) { //se agrega un revisor a la sesión, es decir, al comité
        session._programCommittee.push(user);
    }
    closeSubmissions(session) {
        const BiddingState = require("./BiddingState");
        session.setState(new BiddingState()); //nuevo estado: Bidding, donde los revisores expresan su interés por los papers
    }
}

module.exports = ReceivingState;
