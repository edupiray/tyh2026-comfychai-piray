const SessionState = require("./SessionState");

class AssignmentState extends SessionState { 
    stageName() {
        return "Assignment";
    }
    addReview(session, paper, reviewer, text, score) { //cargar la review de un paper por parte de un revisor asignado
        paper.addReview(reviewer, text, score);
    }
    assignedReviewersFor(session, paper) {
        return paper.assignedReviewers();
    }
    closeReviewing(session) { //politica de aceptación: se seleccionan los papers aceptados según la política definida
        if (!session._acceptancePolicy) {
            throw new Error("No acceptance policy has been set");
        }
        session._acceptedPapers = session._acceptancePolicy.select(session._papers);
        const SelectionState = require("./SelectionState");
        session.setState(new SelectionState()); //nuevo estado: Selection
    }
}

module.exports = AssignmentState;
