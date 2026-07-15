// Flujo básico de Session y validación de operaciones inválidas por etapa (patrón State)
const Session = require("../src/session/Session");
const User = require("../src/model/User");
const Paper = require("../src/model/Paper");
const {Bid, Interests} = require("../src/model/Bid");

let newSession;
let asse;
let juan, julian, matias;
let paper01, paper02, paper03;

beforeEach( ()=> {
    newSession = new Session();
    asse = new Session();
    juan = new User("Juan Gardey", "LIFIA, UNLP", "jgardey@lifia.ar", "123");
    julian = new User("Julián Grigera", "LIFIA, UNLP", "jgrigera@lifia.ar", "123");
    matias = new User("Matias Urbieta", "LIFIA, UNLP", "murbieta@lifia.ar", "123");
    paper01 = new Paper("A new approach on something", [juan, julian], juan);
    paper02 = new Paper("Another approach on something else", [matias, julian], matias);
    paper03 = new Paper("Yet another approach on something", [juan, matias], juan);
});

describe("A new Session", () =>{
    it("should have an empty name", ()=> {
        expect(newSession.name()).toBe("");
    })

    it("should have an empty Program Committee", ()=>{
        expect(newSession.programCommittee()).toHaveLength(0);
    })
})

describe("A Session", ()=>{
    it("should be able to add PC members.", ()=>{
        asse.addReviewer(juan);
        expect(asse.reviewers()).toContain(juan);
        expect(asse.reviewers()).toHaveLength(1);
    })
    it("should allow paper submissions", ()=>{
        expect(asse.canSubmit(paper01)).toBe(true);
        asse.submit(paper01);
        expect(asse.papers()).toContain(paper01);
    })
})

describe("During the bidding process, a Session", ()=>{
    it("should receive bids", ()=>{
        asse.closeSubmissions();
        asse.enterBid(paper02, juan, Interests.Interested);
        expect(asse.bidExistsFor(paper02, juan)).toBe(true);
        expect(asse.interestFor(paper02, juan)).toBe(Interests.Interested);
    })
    it("should allow overriding bids", ()=>{
        asse.closeSubmissions();
        asse.enterBid(paper02, juan, Interests.Interested);
        const secondBid = () => {asse.enterBid(paper02, juan, Interests.Maybe)};
        expect(secondBid).not.toThrow();
        expect(asse.interestFor(paper02, juan)).toBe(Interests.Maybe);
        expect(asse.bids()).toHaveLength(1);
    })
    it("should not allow to receive submissions", ()=>{
        asse.closeSubmissions();
        expect(asse.canSubmit(paper01)).toBe(false);
    })
    it("should fail to receive submissions", ()=>{
        asse.closeSubmissions();
        let submission = ()=>{asse.submit(paper01)};
        expect(submission).toThrow();
    })
})

describe("Stage validation — invalid operations throw errors", function() {
    it("cannot enter bids in Receiving stage", function() {
        expect(function() {
            asse.enterBid(paper01, juan, Interests.Interested);
        }).toThrow("Cannot enter bids in Receiving stage");
    });

    it("cannot close bidding in Receiving stage", function() {
        expect(function() {
            asse.closeBidding();
        }).toThrow("Cannot close bidding in Receiving stage");
    });

    it("cannot add reviews in Receiving stage", function() {
        expect(function() {
            asse.addReview(paper01, juan, "review", 1);
        }).toThrow("Cannot add reviews in Receiving stage");
    });

    it("cannot close reviewing in Receiving stage", function() {
        expect(function() {
            asse.closeReviewing();
        }).toThrow("Cannot close reviewing in Receiving stage");
    });

    it("cannot query accepted papers in Receiving stage", function() {
        expect(function() {
            asse.acceptedPapers();
        }).toThrow("Cannot query accepted papers in Receiving stage");
    });

    it("cannot submit papers in Bidding stage", function() {
        asse.closeSubmissions();
        expect(function() {
            asse.submit(paper01);
        }).toThrow("Cannot submit papers in Bidding stage");
    });

    it("cannot add reviewers in Bidding stage", function() {
        asse.closeSubmissions();
        expect(function() {
            asse.addReviewer(juan);
        }).toThrow("Cannot add reviewers in Bidding stage");
    });

    it("cannot close submissions in Bidding stage", function() {
        asse.closeSubmissions();
        expect(function() {
            asse.closeSubmissions();
        }).toThrow("Cannot close submissions in Bidding stage");
    });

    it("cannot submit papers in Assignment stage", function() {
        asse.addReviewer(juan);
        asse.addReviewer(julian);
        asse.addReviewer(matias);
        asse.submit(paper01);
        asse.closeSubmissions();
        asse.closeBidding();
        expect(function() {
            asse.submit(paper02);
        }).toThrow("Cannot submit papers in Assignment stage");
    });

    it("cannot enter bids in Assignment stage", function() {
        asse.addReviewer(juan);
        asse.addReviewer(julian);
        asse.addReviewer(matias);
        asse.submit(paper01);
        asse.closeSubmissions();
        asse.closeBidding();
        expect(function() {
            asse.enterBid(paper01, julian, Interests.Interested);
        }).toThrow("Cannot enter bids in Assignment stage");
    });

    it("cannot submit papers in Selection stage", function() {
        asse.addReviewer(juan);
        asse.addReviewer(julian);
        asse.addReviewer(matias);
        asse.submit(paper01);
        asse.closeSubmissions();
        asse.closeBidding();
        const assigned = asse.assignedReviewersFor(paper01);
        asse.addReview(paper01, assigned[0], "review", 2);
        const AcceptanceByCount = require("../src/policies/AcceptanceByCount");
        asse.setAcceptancePolicy(new AcceptanceByCount(1));
        asse.closeReviewing();
        expect(function() {
            asse.submit(paper02);
        }).toThrow("Cannot submit papers in Selection stage");
    });

    it("cannot add reviews in Selection stage", function() {
        asse.addReviewer(juan);
        asse.addReviewer(julian);
        asse.addReviewer(matias);
        asse.submit(paper01);
        asse.closeSubmissions();
        asse.closeBidding();
        const assigned = asse.assignedReviewersFor(paper01);
        asse.addReview(paper01, assigned[0], "review", 2);
        const AcceptanceByCount = require("../src/policies/AcceptanceByCount");
        asse.setAcceptancePolicy(new AcceptanceByCount(1));
        asse.closeReviewing();
        expect(function() {
            asse.addReview(paper01, assigned[1], "late", 1);
        }).toThrow("Cannot add reviews in Selection stage");
    });
})