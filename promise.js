/*
 * Promise 
 * By nighca [nighca@live.cn]
 */

function Promise(fn, delay) {
	var promise = this;

	promise.list = {
		onresolve: [],
		onreject: []
	};
	promise.runned = false;
	promise.state = 0;
	promise.err = null;
	promise.data = null;

	promise.run = function(){
		if(this.runned){
			return;
		}
		this.runned = true;

		try{
			fn(function(err, data){
				if(err){
					promise.reject(err);
				}else{
					promise.resolve(data);
				}
			});
		}catch(e){
			promise.reject(e);
		}

		return this;
	};

	!delay && promise.run();
}

Promise.prototype.then = function(onresolve, onreject){
	var promise = this,
		fn =
			promise.state ?

			function(cb){
				promise.run && promise.run();

				promise.state === 1 ?
					(onresolve ? onresolve(promise.data, cb) : cb(null, promise.data)) :
					(onreject ? onreject(promise.err, cb) : cb(promise.err));
			} :

			function(cb){
				promise.run && promise.run();

				promise.list.onresolve.push(function(data){
					onresolve ? onresolve(data, cb) : cb(null, data);
				});
				promise.list.onreject.push(function(err){
					onreject ? onreject(err, cb) : cb(err);
				});
			};

	return new Promise(fn, !promise.runned);
};

Promise.prototype.resolve = function(data){
	this.state = 1;
	this.data = data;

	this.list.onresolve.forEach(function(onresolve){
		try{
			onresolve(data);
		}catch(e){}
	});
};

Promise.prototype.reject = function(err){
	this.state = 2;
	this.err = err;

	this.list.onreject.forEach(function(onreject){
		try{
			onreject(err);
		}catch(e){}
	});
};

Promise.finish = function(fns, delay){
	var _fn =
		Array.isArray(fns) ?

		function(callback){
			var notFinished = fns.length,
				datas = [],
				finished = false,
				cb = function(){
					finished = true;
					return callback.apply(this, arguments);
				};

			fns.forEach(function(fn, i){
				fn(function(err, data){
					if(finished){
						return;
					}

					notFinished--;
					if(err){
						finished = true;
						cb(err);
					}else{
						datas[i] = data;

						if(!notFinished){
							finished = true;
							cb(null, datas);
						}
					}
				});
			});
		} :

		fns;

	return new Promise(_fn, delay);
};

Promise.finishAny = function(fns, delay){
	var _fn = 
		Array.isArray(fns) ?

		function(callback){
			var notFinished = fns.length,
				datas = [],
				errs = [],
				finished = false,
				cb = function(){
					finished = true;
					return callback.apply(this, arguments);
				};

			fns.forEach(function(fn, i){
				fn(function(err, data){
					if(finished){
						return;
					}

					notFinished--;
					if(err){
						errs[i] = err;

						if(!notFinished){
							cb(errs);
						}
					}else{
						cb(null, data);
					}
				});
			});
		} :

		fns;

	return new Promise(_fn, delay);
};