const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const rsvp = require('../../routes/install');
const app = require('../../app')
const db = require('../../models/db');
chai.use(chaiHttp);
chai.should();

describe('Install Route', function() {

    it('Install should be available', (done) => {
        chai.request(app)
            .get('/install')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });

    it('Install accept a POST', (done) => {
        chai.request(app)
            .post('/install')
            .type('form')
            .send({
                'username': 'test',
                'password': 'test'
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });
    
    it('Install should not accept a second POST', (done) => {
        chai.request(app)
            .post('/install')
            .type('form')
            .send({
                'username': 'test2',
                'password': 'test2'
            })
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                done();
            });
    });


});

