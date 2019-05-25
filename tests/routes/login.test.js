const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const rsvp = require('../../routes/install');
const app = require('../../app')
const db = require('../../models/db');
chai.use(chaiHttp);
chai.should();

describe('Login Route', function() {
    
    it('Login should be available', (done) => {
        chai.request(app)
            .get('/login')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });

    it('Login is successful', (done) => {
        chai.request(app)
            .post('/login')
            .type('form')
            .send({
                'username': 'test',
                'password': 'test'
            })
            .end((err, res) => {
                expect(res).to.redirectTo(/\/$/)
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });

    it('Login failed', (done) => {
        chai.request(app)
            .post('/login')
            .type('form')
            .send({
                'username': 'test',
                'password': 'test2'
            })
            .end((err, res) => {
                expect(res).to.redirectTo(/\/login$/)
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });

});

