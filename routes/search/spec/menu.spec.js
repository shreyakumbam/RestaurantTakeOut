// spec/menu.spec.js

const request = require('supertest');
const app = require('../app'); 

describe('Menu API', () => {
  // Test for /menu/:item endpoint
  describe('GET /menu/:item', () => {
    it('should return a 400 status with an "Invalid Input" message when item is not provided', (done) => {
      request(app)
        .get('/menu/')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.message).toBe('Invalid Input');
          done();
        });
    });

    it('should return a 404 status with a "No Item Found" message when the requested item does not exist', (done) => {
      request(app)
        .get('/menu/nonexistentitem')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.message).toBe('No Item Found');
          done();
        });
    });

    it('should return a 200 status when a valid item is found', (done) => {
      request(app)
        .get('/menu/existingitem')
        .expect(200)
        .expect('content-type', 'application/json')
        .end((err, res) => {
          if (err) return done(err);
        
          done();
        });
    });
  });

 
});
