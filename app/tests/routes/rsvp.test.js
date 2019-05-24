const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const rsvp = require('../../routes/rsvp');
const app = require('../../app')
const db = require('../../models/db');
chai.use(chaiHttp);
chai.should();
var http = require('http');


describe('RSVP Route', function() {

    before(function(done) {
        db.initialize().then( () => {
            db.Household.create({ name: 'test', passcode: 'passcode', notes: 'Here are my notes' })
                .then(household => {
                    db.Guest.create({name:'Guest A', rehearsal_dinner: true, attending: true, email: 'guest@example.com' })
                        .then(guest => {
                            guest.setHousehold(household.id);
                            guest.save().then(() => { done() });
                        })
                });
        })
    });

    it('RSVP protected without a passcode', (done) => {
        chai.request(app)
            .get('/rsvp')
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                done();
            });
    });

    it('RSVP rejects incorrect passcode', (done) => {
        chai.request(app)
            .post('/rsvp')
            .type('form')
            .send({
                'inputPasscode': 'passcode1'
            })
            .end((err, res, body) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                done();
            });
    });

    it('RSVP accepts correct passcode', (done) => {
        chai.request(app)
            .post('/rsvp')
            .type('form')
            .send({
                'inputPasscode': 'passcode'
            })
            .end((err, res, body) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res).to.have.cookie('connect.sid');
                chai.request(app)
                    .get('/rsvp')
                    .set('Cookie', res.headers['set-cookie'][0])
                    .end((err, res, body) => {
                        res.should.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body.notes).to.equal('Here are my notes');
                        expect(res.body.guests).to.have.lengthOf(1);
                        expect(res.body.guests[0].id).to.equal(1)
                        expect(res.body.guests[0].name).to.equal('Guest A')
                        expect(res.body.guests[0].attending).to.equal(true)
                        expect(res.body.guests[0].email).to.equal('guest@example.com')
                        done();
                    })
            });
    });


});

