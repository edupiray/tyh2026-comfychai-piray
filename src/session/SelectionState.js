const SessionState = require("./SessionState");

class SelectionState extends SessionState { //estado de selección de papers. Inicia la sesión en este estado.
    stageName() {
        return "Selection";
    }
    acceptedPapers(session) { //consulta de los papers aceptados según la política de aceptación definida
        return session._acceptedPapers;
    }
    assignedReviewersFor(session, paper) { //consulta de los revisores asignados a un paper
        return paper.assignedReviewers();
    }
}

module.exports = SelectionState;
