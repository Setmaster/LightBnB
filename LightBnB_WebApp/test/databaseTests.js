const {expect} = require('chai');
const {getUserWithEmail, getUserWithId} = require('../db/database');

describe('getUserWithEmail', function () {
    it('should return a user object when a valid email is provided', async function () {
        const expectedUser = {
            id: 3,
            name: 'Dominic Parks',
            email: 'victoriablackwell@outlook.com',
            password: '$2a$10$FB/BOAVhpuLvpOREQVmvmezD4ED/.JBIDRh70tGevYzYzQgFId2u.'
        };

        const user = await getUserWithEmail('victoriablackwell@outlook.com');
        expect(user).to.deep.equal(expectedUser);
    });

    it('should return null if no user is found with the provided email', async function () {
        const user = await getUserWithEmail('nonexistentemail@example.com');
        expect(user).to.be.null;
    });
});
describe('getUserWithId', function () {
    it('should return a user object when a valid id is provided', async function () {
        const expectedUser = {
            id: 3,
            name: 'Dominic Parks',
            email: 'victoriablackwell@outlook.com',
            password: '$2a$10$FB/BOAVhpuLvpOREQVmvmezD4ED/.JBIDRh70tGevYzYzQgFId2u.'
        };

        const user = await getUserWithId('3');
        expect(user).to.deep.equal(expectedUser);
    });

    it('should return null if no user is found with the provided id', async function () {
        const user = await getUserWithId('9999'); // Assuming this ID does not exist
        expect(user).to.be.null;
    });
});