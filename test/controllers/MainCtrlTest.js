'use strict';
/* global describe, context, it, beforeEach */

var path = require('path');
var sinon = require('sinon');
var assert = require('chai').assert;
var ROOT_DIR = process.env.ROOT_DIR || __dirname + '/..';
var Sut = require( path.join(ROOT_DIR, 'controllers', 'MainCtrl.js') );


describe(__dirname + '/ProxyToUserSegmentsCtrl.js', function(){
  var sut;
  var req;
  var res;
  var next;
  var config;
  var errHandler;
  var queryString;
  var request;

  beforeEach(function(done){
    config = {
      host: 'localhost',
      port: '0000'
    };
    queryString = {
      stringify: sinon.stub()
                      .returns('key=value')
    };
    request = {
      pipe: sinon.spy(),
      get: sinon.stub()
                .returnsThis(),
    };
    req = {
      cookies: {
        dci: 'dci'
      },
      query: {
        partnerid: 'partnerid'
      }
    };
    res = {
      set: sinon.spy()
    };
    errHandler = sinon.spy();
    next = sinon.spy();

    sut = new Sut(request, queryString, errHandler, config);
    done();
  });


  context('initialization', function(){

    it('success init', function () {
      var middlewareWrapper = new Sut(request, queryString, errHandler, config);
      assert.isFunction(middlewareWrapper, 1);
      assert.instanceOf(middlewareWrapper, Sut, 2);
    });

    it('error init', function () {
      try {
        new Sut();
        assert.ok(false, 1);
      } catch (e) {
        assert.ok(true);
      }
    });

  });

  context('headers', function(){

    it('X-STATUS header is present', function(){
      sut(req, res, next);

      assert.ok(res.set.calledWith('X-STATUS', '200'), 1);
    });

  });

  context('proxy', function(){

    it('#next() don\'t call', function(){
      sut(req, res, next);

      assert.isNotOk(next.called, 1);
    });

    it('send request', function(){
      sut(req, res, next);

      assert.ok(request.get.called, 1);
      assert.isObject(request.get.firstCall.args[0], 2);

      assert.property(request.get.firstCall.args[0], 'url', 3);
      assert.property(request.get.firstCall.args[0], 'timeout', 4);
      assert.isString(request.get.firstCall.args[0].url, 5);
      assert.isNumber( parseInt(request.get.firstCall.args[0].timeout), 6);
      assert.isFunction(request.get.firstCall.args[1], 6);

      assert.ok(request.pipe.called, 7);
    });

    it('handler error ', function(){
      sut(req, res, next);

      var callback = request.get.firstCall.args[1];
      var err = new Error();

      callback();
      callback(err);

      assert.ok(errHandler.called, 1);
      assert.ok(errHandler.calledWith(req, res), 2);
      assert.ok(errHandler.calledWith(req, res, err), 3);
    });

  });

});