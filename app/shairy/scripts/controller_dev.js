angular.module('shairy.controllers', [])

.controller('HomeCtrl', function ($scope, $rootScope, $http, $ionicLoading){
	$scope.user = {'email': '', 'password': '', 'rememberMe': false};

	$scope.clear = function (field){
		$scope.user[field] = '';
		setTimeout(function (){
			document.getElementById(field).focus();
		}, 100);
	};

	$scope.login = function (){
		if (!$scope.inError){
			if ($rootScope.online){
				$ionicLoading.show({template: 'Accesso in corso...'});
				Parse.User.logIn($scope.user.email, $scope.user.password, {
					success: function (user){
						var me = user.toJSON();
						var Photo = Parse.Object.extend('Photo');
						var query = new Parse.Query(Photo);
						query.equalTo('user', user);
						query.find({
							success: function (photos){
								if ($scope.user.rememberMe)
									localStorage.password = $scope.user.password;
								var relation = user.relation('workers');
								relation.query().find({
									success: function (workers){
										if (workers.length)
											me.workers = workers;
										else
											me.workers = [];
										relation = user.relation('services');
										relation.query().find({
											success: function (services){
												if (services.length)
													me.services = services;
												else
													me.services = [];
												relation = user.relation('extra_openings');
												relation.query().find({
													success: function (extra_openings){
														if (extra_openings.length)
															me.extra_openings = extra_openings;
														else
															me.extra_openings = [];
														window.postMessage({action: 'login', photos: photos, me: me});
														setTimeout(function (){
															$rootScope.openNew('layer', 'profile');
															$ionicLoading.hide();
															window.postMessage({action: 'loggedin'});
															localStorage.sessiontoken=user._sessionToken;
														}, 1000);
													},
													error: function (error){
														$rootScope.doError('Errore nel caricamento degli orari extra.', 'Login Load Extra Openings', error);
														$ionicLoading.hide();
													}
												});
											},
											error: function (error){
												$rootScope.doError('Errore nel caricamento dei trattamenti.', 'Login Load Services', error);
												$ionicLoading.hide();
											}
										});
									},
									error: function (error){
										$rootScope.doError('Errore nel caricamento dello staff.', 'Login Load Workers', error);
										$ionicLoading.hide();
									}
								});
							},
							error: function (error){
								$rootScope.doError('Errore nel caricamento delle foto.', 'Login Load User Photos', error);
								$ionicLoading.hide();
							}
						});
					},
					error: function (me, error){
						$rootScope.doError('Email o password errati.', 'Login', error);
						$ionicLoading.hide();
					}
				});
			} else
				$rootScope.doError('Non hai una connessione ad Internet attiva.', 'Login');
		} else
			$rootScope.doError('Errore nel caricamento; riavviare l\'applicazione.', 'Login');
	};

	var autoLogin = function (){
		if ($rootScope.online){
			Parse.User.logIn($rootScope.me.username, localStorage.password, {
				success: function (me){
					var Photo = Parse.Object.extend('Photo');
					var query = new Parse.Query(Photo);
					query.descending('createdAt');
					query.equalTo('user', Parse.User.current());
					query.find({
						success: function (photos){
							var relation = me.relation('workers');
							relation.query().find({
								success: function (workers){
									if (workers.length)
										$rootScope.me.workers = workers;
									else
										$rootScope.me.workers = [];
									relation = me.relation('services');
									relation.query().find({
										success: function (services){
											if (services.length)
												$rootScope.me.services = services;
											else
												$rootScope.me.services = [];
											relation = me.relation('extra_openings');
											relation.query().find({
												success: function (extra_openings){
													if (extra_openings)
														$rootScope.me.extra_openings = extra_openings;
													else
														$rootScope.me.extra_openings = [];
													window.postMessage({action: 'login', photos: photos, me: $rootScope.me});
													setTimeout(function (){
														$rootScope.openNew('layer', 'profile');
														$ionicLoading.hide();
														window.postMessage({action: 'loggedin'});
													}, 1000);
												},
												error: function (error){
													$rootScope.doError('Errore nel caricamento degli orari extra.', 'Login Load Extra Openings', error);
													$ionicLoading.hide();
												}
											});
										},
										error: function (error){
											$rootScope.doError('Errore nel caricamento dei trattamenti.', 'Login Load Services', error);
											$ionicLoading.hide();
										}
									});
								},
								error: function (error){
									$rootScope.doError('Errore nel caricamento dello staff.', 'Login Load Workers', error);
									$ionicLoading.hide();
								}
							});
						},
						error: function (error){
							if (registration)
								$ionicLoading.hide();
							else
								document.getElementById('intro-animation').classList.add('start');
							$rootScope.doError('Errore nel caricamento delle foto.', 'Login Load User Photos', error);
						}
					});
				},
				error: function (me, error){
					$rootScope.doError('Email o password errati.', 'Login', error);
					if (registration)
						$ionicLoading.hide();
					else
						document.getElementById('intro-animation').classList.add('start');
				}
			});
		} else {
			document.getElementById('intro-animation').classList.add('start');
			$rootScope.doError('Non hai una connessione ad Internet attiva.', 'Login');
		}
	};

	var preloadSections = function (){
		for (i in $rootScope.toPreload)
			if (!$rootScope.inError){
				var wv;
				if ($rootScope.toPreload[i].indexOf('http://') >= 0)
					wv = new steroids.views.WebView($rootScope.toPreload[i]);
				else
					wv = new steroids.views.WebView('app/shairy/' + $rootScope.toPreload[i] + '.html');
				wv.preload({id: $rootScope.toPreload[i]}, {
					onSuccess: function (){
						$scope.$apply(function (){
							$scope.loadStatus++;
							if ($scope.loadStatus === 1)
								steroids.splashscreen.hide();
						});
					},
					onFailure: function (error){
						if (error.errorDescription === 'A preloaded layer with this identifier already exists')
							$scope.$apply(function (){
								$scope.loadStatus++;
							});
						else {
							$rootScope.inError = true;
							$rootScope.doError('Errore nel caricamento; riavviare l\'applicazione.', 'Load Data Home', error);
							steroids.splashscreen.hide();
						}
					}
				});
			}
	};

	$scope.freeTest = function(){
		steroids.openURL("http://salonedigitale.com/#subscribe");
	};

	$scope.$watch('loadStatus', function (){
		if ($scope.loadStatus === $rootScope.toPreload.length){
			if ($rootScope.inError)
				$rootScope.doError('Errore nel caricamento; riavviare l\'applicazione.', 'Login');
			else if (localStorage.password && $rootScope.me && $rootScope.me.type === 'pro')
				autoLogin();
			else
				document.getElementById('intro-animation').classList.add('start');
			$scope.loadStatus = 0;
		}
	});

	window.addEventListener('message', function (e){
		if (e.data.action === 'loggedin')
			setTimeout(function (){
				document.getElementById('intro-animation').classList.remove('start');
			}, 500);
		else if (e.data.action === 'logout')
			setTimeout(function (){
				document.getElementById('intro-animation').classList.add('start');
			}, 1000);
	});

	document.addEventListener('deviceready', function (){
	    Parse.Cloud.run('data', {}, {
	    	success: function (data){
	    		localStorage.products = JSON.stringify(data.products);
	    		localStorage.allServices = JSON.stringify(data.treatments);
	            $scope.loadStatus = 0;
				preloadSections();
	    	},
	    	error: function (data, error){
	    		$rootScope.inError = true;
			    $rootScope.doError('Errore nel caricamento; riavviare l\'applicazione.', 'Load Data Home', error);
			    steroids.splashscreen.hide();
	    	}		
		});
	});
})

.controller('ProfileCtrl', function ($scope, $rootScope, $ionicActionSheet){
	$scope.options = function (){
		$ionicActionSheet.show({
			// buttons: [
			// 	{ text: 'Termini e Condizioni' }
			// ],
			destructiveText: 'Esci',
			cancelText: 'Annulla',
			destructiveButtonClicked: function (){
				Parse.User.logOut();
				window.postMessage({action: 'logout'});
				$rootScope.backAll();
				return true;
			},
			// buttonClicked: function (i){
			// 	$rootScope.openNew('modal', 'terms');
			// 	return true;
			// }
		});
	};

	$scope.openProfile = function (){
		if ($rootScope.online){	
			localStorage.flag=0;	
			window.postMessage({action: 'viewingSettings', value: 'profile'});
			$rootScope.openNew('layer', 'settings');
		}
	};

	$scope.editSalone = function (title){
		if ($rootScope.online){
			localStorage.flag1=0;
			window.postMessage({action: 'viewingSalone', value: title});
			$rootScope.openNew('layer', 'salone');
		}
	};

	$scope.openSocial = function (){
		if ($rootScope.online){
			window.postMessage({action: 'viewingOptions'});
			$rootScope.openNew('layer', 'options');
		}
	};

	$scope.openInfos = function (){
		if ($rootScope.online){
			localStorage.flag=0;						
			window.postMessage({action: 'viewingSettings', value: 'infos'});
			$rootScope.openNew('layer', 'settings');
		}
	};

	$scope.activeProfile = function (){
		if ($rootScope.online){
			var oldme = angular.copy($rootScope.me);
			var me = Parse.User.current();
			var profile = me.get('profile');
			profile.active = !profile.active;
			me.set('profile', profile);
			window.postMessage({action: 'modsalone', value: me});
			user.save(null, {
				error: function (user, error){
					window.postMessage({action: 'modsalone', value: oldme});
					$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Active Profile', error);
				}
			});
		}
	};

	$scope.openOnlineProfile = function (){
		window.open($rootScope.me.base_url + $rootScope.me.slug, '_blank', 'location=no,clearcache=yes,clearsessioncache=yes');
	};
})

.controller('SaloneCtrl', function ($scope, $rootScope, $http, $timeout){
	var options, oldme;

	$scope.openSettings = function (type, i){
		if ($rootScope.online){
			localStorage.flag=0;
			localStorage.flag3=0;			
			window.postMessage({action: 'viewingSettings', value: type, index: i});
			$rootScope.openNew('layer', 'settings');
		}
	};

	$scope.remove = function (type, index){
		if(localStorage.flag1!=0){
			return;
			}
		else{
			localStorage.flag1=1;			
			if ($rootScope.online){
			navigator.notification.confirm(
			    'Sei sicuro di voler rimuovere questo elemento?',
			    function (i){
			    	if (i === 1){
						Parse.User.become(localStorage.sessiontoken).then(function (user) {
							var user=user;
							var item = $rootScope.me[type + 's'][index];
							$rootScope.me[type + 's'].splice(index, 1);
							window.postMessage({action: 'modsalone', value: $rootScope.me});
							var relation = user.relation(type + 's');
							if (type === 'worker'){
								var Worker = Parse.Object.extend('Worker');
								relation.remove(new Worker({id: item.objectId}));
							} else if (type === 'service'){
								var Service = Parse.Object.extend('Service');
								relation.remove(new Service({id: item.objectId}));
							} else if (type === 'extra_opening'){
								var Extra_Opening = Parse.Object.extend('Extra_Opening');
								relation.remove(new Extra_Opening({id: item.objectId}));
							}
							user.save(null, {
								success: function (user){
									$rootScope.doTip('Rimozione effettuata con successo.');
									localStorage.flag1=0;
								},
								error: function (user, error){
									localStorage.flag1=0;
									window.postMessage({action: 'modsalone', value: oldme});
									$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Remove User ' + $rootScope.ucFirst(type), error);
								}
							});
						  }, function (error) {
							localStorage.flag1=0;
							alert(error.messasge);
						  });
			    		
					}else{
						localStorage.flag1=0;}
		    	},
			    'Attenzione',
			    ['Si', 'No']
			);
		}
		}
	};

	document.addEventListener('visibilitychange', function (){
		if (document.hidden && !$scope.opened){
			$rootScope.$apply(function (){
				$scope.section = '';
			});
		}
	}, false);

	window.addEventListener('message', function (e){
		if (e.data.action === 'login')
			options = JSON.parse(localStorage.products);
		else if (e.data.action === 'viewingSalone'){
			oldme = angular.copy($rootScope.me);
			$scope.$apply(function (){
				$scope.opened = true;
				$scope.section = e.data.value;
			});
		}
	}, false);
})

.controller('RollCtrl', function ($scope, $rootScope, $ionicActionSheet,$ionicScrollDelegate, $ionicLoading){
	
	$scope.page = 1;
	$scope.ppp = 15;
	$scope.remoteurl=[];
	$scope.currentimage=[];
	$scope.cameraimage=[];
	$scope.preimage=[];
	$scope.photoimage=[];
	var currentnum=0;
	var photonum=0;
	$scope.openPhoto = function (i){
		window.postMessage({action: 'viewingPhoto', value: $scope.remoteurl[i],value2:i,value4:0});
		$rootScope.openNew('layer', 'photo');
	};
	$scope.openPhoto1 = function (i){
		window.postMessage({action: 'viewingPhoto', value: $scope.cameraimage[i], value1:i, value3:$scope.photoimage[i], value4:1});
		$rootScope.openNew('layer', 'photo');
	};
	
	$scope.loadMore = function (){
		$scope.page++;
		$scope.$broadcast('scroll.infiniteScrollComplete');
	};

	var errorHandlerDl = function (error){
		$scope.loadRollPhotos++;
		$rootScope.doError('Caricamento foto non riuscito.', 'Download Photos Roll', error);
	};

	var findInArray = function (name, array){
		if (array.length)
			return array.filter(function (v){
				return v.name == name;
			})[0];
		else
			return false;
	};

	var updatePhotos = function (){
		$scope.loadRollPhotos++;
    	$scope.photosLoaded++;
    	if ($scope.photosLoaded === $scope.photosTotal){
    		$ionicLoading.hide();
    		delete $scope.images;
 			$scope.photosTotal = -1;
 			if ($scope.error)
 				$rootScope.doTip('Alcune foto non sono state aggiunte con successo.');
 			else
 				$rootScope.doTip('Foto aggiunte con successo.');
 			$scope.error = false;
    	}
	};

	var downloadPhotos = function (){
		$scope.loadRollPhotos = 0;
		$scope.remoteurl=[];
		$scope.cameraimage=[];
		if (typeof LocalFileSystem != 'undefined'){
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs){
				if ($rootScope.photos.length)
					fs.root.getDirectory('Shairy', {create: true}, function (de){
						var dr = de.createReader();
						var length=$rootScope.photos.length;
						if(length>0)
						dr.readEntries(function (entries){
							
							for (i in $rootScope.photos){
									$scope.remoteurl[i]=$rootScope.photos[length-1-i].image.url;
							}
						}, errorHandlerDl);
					}, errorHandlerDl);
			}, errorHandlerDl);
		} else
			errorHandlerDl();
	};
	var errorHandler = function (error){
		$rootScope.doError('Si è verificato un errore nel caricamento di una foto.', 'Add Photos', error, true);
		$scope.error = true;
    	$scope.photosLoaded++;
    	if ($scope.photosLoaded === $scope.photosTotal){
    		$ionicLoading.hide();
    		delete $scope.images;
 			$scope.photosTotal = -1;
 			if ($scope.error)
 				$rootScope.doTip('Alcune foto non sono state aggiunte con successo.');
 			else
 				$rootScope.doTip('Foto aggiunte con successo.');
 			$scope.error = false;
    	}
	};
	var photoFromCamera = function (){
		Parse.User.become(localStorage.sessiontoken).then(function (user) {
			var user=user;
			  navigator.camera.getPicture(
			function (data){				
				$scope.$apply(function (){					
					$ionicLoading.show({template: 'Pubblicazione...'});
					$scope.fotoimage = 'data:image/png;base64,' + data;
					$scope.currentimage[currentnum]=$scope.fotoimage;
					currentnum++;
					for(var i=0;i<currentnum;i++){
						$scope.cameraimage[i]=$scope.currentimage[currentnum-i-1];
						}								
					var d=new Date();
					var n=d.getTime();					
					var imageName=n+'.png';
					var image = new Parse.File(imageName, {base64: $scope.fotoimage.replace('data:image/png;base64,', '')}, 'image/png');
					image.save().then(function (){
						var Photo = Parse.Object.extend('Photo');
						var photo = new Photo();
						photo.set('image', image);
						photo.set('photoSource', 'library');
						photo.set('user', user);
						photo.save(null, {
							success: function (photo){								
								$ionicLoading.hide();
								$scope.preimage[photonum]=photo.id;
								photonum++;
								for(var i=0;i<photonum;i++){
									$scope.photoimage[i]=$scope.preimage[photonum-i-1];
									}									
								$rootScope.doTip('Caricato con successo');	
							},
							error: function (photo, error){
								errorHandler(error);
							}
						});
					}, function (error){
						errorHandler(error);
					});		       
					
				});
			},
			function (){
			},																																							
			{
				quality: 50,
				destinationType: Camera.DestinationType.DATA_URL,
				correctOrientation: true,
				saveToPhotoAlbum: true,
				allowEdit: false,
				targetWidth: 1920,
				targetHeight: 1920
			}
		);
			}, function (error) {
			  // The token could not be validated.
			});	
		
	};

	var photoFromLibrary = function (){
		Parse.User.become(localStorage.sessiontoken).then(function (user) {
			var user=user;
			navigator.camera.getPicture(		
			function (data){
				$scope.$apply(function (){
					$ionicLoading.show({template: 'Pubblicazione...'});
					$scope.fotoimage = 'data:image/png;base64,' + data;
					$scope.currentimage[currentnum]=$scope.fotoimage;
					currentnum++;
					for(var i=0;i<currentnum;i++){
						$scope.cameraimage[i]=$scope.currentimage[currentnum-i-1];
						}					
					var d=new Date();
					var n=d.getTime();					
					var imageName=n+'.png';
					var image = new Parse.File(imageName, {base64: $scope.fotoimage.replace('data:image/png;base64,', '')}, 'image/png');
					image.save().then(function (){
						var Photo = Parse.Object.extend('Photo');
						var photo = new Photo();
						photo.set('image', image);
						photo.set('photoSource', 'library');
						photo.set('user', user);
						photo.save(null, {
							success: function (photo){								
								$ionicLoading.hide();
								$rootScope.doTip('Caricato con successo.');						
								
							},
							error: function (photo, error){
								errorHandler(error);
							}
						});
					}, function (error){
						errorHandler(error);
					});	
				});
			},
			function (){
			},
			{
				quality: 50,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				destinationType: Camera.DestinationType.DATA_URL,
				correctOrientation: true,
				saveToPhotoAlbum: false,
				allowEdit: false,
				targetWidth: 1920,
				targetHeight: 1920
			}
		);
		  }, function (error) {
			// The token could not be validated.
		  });
		
	};
	$scope.pickImages = function (){
		$ionicActionSheet.show({
					buttons: [
						{ text: 'Scatta' },
						{ text: 'Libreria' }
					],					
					cancelText: 'Annulla',					
					buttonClicked: function (i){
						if (i)
							photoFromLibrary();
						else
							photoFromCamera();
						return true;
					}
				});		
	};

	window.addEventListener('message', function (e){
		if (e.data.action === 'login')
			downloadPhotos();
		if (e.data.action === 'delindex')
			$scope.$apply(function (){				
				$scope.delindex = e.data.value;
				var length=$scope.cameraimage.length;
				$scope.tem=$scope.cameraimage;
				$scope.cameraimage=[];
				var newindex=0;
				for(var i=0;i<length;i++){
					if(i==$scope.delindex)
					continue;
					else{
					$scope.cameraimage[newindex]=$scope.tem[i];
					newindex++;
					}
					}						
			});
		if (e.data.action === 'delindex1')
			$scope.$apply(function (){				
				$scope.delindex1 = e.data.value;
				var length=$scope.remoteurl.length;
				$scope.tem1=$scope.remoteurl;
				$scope.remoteurl=[];
				var newindex=0;
				for(var i=0;i<length;i++){
					if(i==$scope.delindex1)
					continue;
					else{
					  $scope.remoteurl[newindex]=$scope.tem1[i];
					  newindex++;
					}
					}							
			});
	});	
})

.controller('PhotoDetailCtrl', function ($scope, $rootScope, $timeout, $ionicScrollDelegate, $ionicLoading){
	$scope.photo = {};
	$scope.index = -1;

	$scope.remove = function (){
		$scope.imageurl=document.getElementById('myurl').value;
		$scope.arrange=document.getElementById('arrangeindex').value;
		alert($scope.imageflag);
		if ($rootScope.online){
			if($scope.imageflag==0){
			navigator.notification.confirm(
			    'Sei sicuro di voler eliminare la foto?',
			    function (i){
			    	if (i === 1){
						var photos = $rootScope.photos;
						photos.filter(function (v, i){
							if (v.image.url === $scope.imageurl){
								var objid=v.objectId;
								var Photo = Parse.Object.extend('Photo');
								var query = new Parse.Query(Photo);
								query.get(objid, {
									success: function (photo){
										photo.destroy({
											success: function(photo){
												$rootScope.doTip('Rimozione effettuata con successo.');
												window.postMessage({action: 'delindex1', value: $scope.originindex});
												},
											error: function (photo, error){
												$rootScope.doError('Errore nella rimozione della foto.', 'Delete Photo', error);
												window.postMessage({action: 'delphoto', value: $rootScope.photos});
											}
										});
									},
									error: function (error){
										$rootScope.doError('Errore nella rimozione della foto.', 'Delete Photo', error);
										window.postMessage({action: 'delphoto', value: $rootScope.photos});
									}
								});
								photos.splice(i, 1);
								window.postMessage({action: 'delphoto', value: photos});								
								return;
							}						  
						});
						$rootScope.back();
					}
		    	},
			    'Attenzione',
			    ['Si', 'No']
			);
			}
			else if($scope.imageflag==1){
				navigator.notification.confirm(
			    'Sei sicuro di voler eliminare la foto?',
			    function (i){
			    	if (i === 1){
						  var objid=$scope.objectid;
						  var Photo = Parse.Object.extend('Photo');
						  var query = new Parse.Query(Photo);
						  query.get(objid, {
							  success: function (photo){
								  photo.destroy({
									  success: function(photo){
										  $rootScope.doTip('Rimozione effettuata con successo.');
										  window.postMessage({action: 'delindex', value: $scope.arrangeindex});
										  },
									  error: function (photo, error){
										  $rootScope.doError('Errore nella rimozione della foto.', 'Delete Photo', error);
										  window.postMessage({action: 'delphoto', value: $rootScope.photos});
									  }
								  });
							  },
							  error: function (error){
								  $rootScope.doError('Errore nella rimozione della foto.', 'Delete Photo', error);
								  window.postMessage({action: 'delphoto', value: $rootScope.photos});
							  }
						  });	
						$rootScope.back();
					}
		    	},
			    'Attenzione',
			    ['Si', 'No']
			);
				}
		}
	};

	window.addEventListener('message', function (e){
		if (e.data.action === 'viewingPhoto')
			$scope.$apply(function (){
				$scope.opened = true;
				$ionicScrollDelegate.scrollTop();
				$scope.index = e.data.value;
				$scope.arrangeindex=e.data.value1;
				$scope.originindex=e.data.value2;
				$scope.objectid=e.data.value3;
				$scope.imageflag=e.data.value4;				
			});
	});

	document.addEventListener('visibilitychange', function (){
		if (document.hidden && !$scope.opened)
			$scope.$apply(function (){
				$scope.photo = {};
				$scope.index = -1;
			});
	}, false);
})

.controller('SettingsCtrl', function ($scope, $rootScope, $http, $ionicActionSheet, $ionicScrollDelegate, $ionicLoading){
	var oldme, me, initItem, item;
	$scope.epp = 11;
	$scope.prices = _.range(1, 201);

	var initialize = function (data){
		oldme = me = angular.copy($rootScope.me);
		$ionicScrollDelegate.scrollTop();
		$scope.missing = {};
		$scope.opened = true;
		$scope.type = data.value;
		$scope.index = data.index;
		if ($scope.type === 'service'){
			item = 'service';
			$scope.page = 1;
			$scope.spage = 1;
			$scope.allServices = JSON.parse(localStorage.allServices);
			$scope.searching = {value: ''};
			if (!me.services)
				me.services = [];
			if ($scope.index >= 0)
				$scope.service = me.services[$scope.index];
			else
				$scope.service = {name: 'Absolute Pearl', price: 1, duration: 900};
		} else if ($scope.type === 'worker'){
			item = 'worker';
			if (!me.workers)
				me.workers = [];
			if ($scope.index >= 0){
				$scope.worker = me.workers[$scope.index];
				$scope.worker.unavailable = !$scope.worker.available;
			} else
				$scope.worker = {first_name: '', last_name: '', role: '', available: true, unavailable: false};
		} else if ($scope.type === 'infos'){
			item = 'salone';
			$scope.searching = {value: ''};
			if (!me.workcity)
				me.workcity = {};
			if (!me.worktype)
				me.worktype = 'Unisex';
			if (!me.products)
				me.products = [];
			$scope.products = JSON.parse(localStorage.products);
			$scope.myproducts = {};
			for (i in me.products)
				$scope.myproducts[me.products[i]] = true;
			$scope.salone = {workname: me.workname, worktype: me.worktype, workcity: me.workcity, tel1: me.tel1, tel2: me.tel2, facebook: me.facebook, products: me.products};
		} else if ($scope.type === 'time_table'){
			item = 'day';
			$scope.day = {};
			if (me.time_table[$scope.index].start_time === null)
				$scope.day.closed = true;
			else
				$scope.day.closed = false;
			if (me.time_table[$scope.index].start_break === null)
				$scope.day.continued = true;
			else
				$scope.day.continued = false;
			for (i in me.time_table[$scope.index])
				if (i !== 'day')
					if (me.time_table[$scope.index][i] === null){
						$scope.day[i + '_h'] = '0';
						$scope.day[i + '_m'] = '00';
					} else {
						$scope.day[i + '_h'] = me.time_table[$scope.index][i].split(':')[0];
						$scope.day[i + '_m'] = me.time_table[$scope.index][i].split(':')[1];
					}
		} else if ($scope.type === 'extra_opening'){
			item = 'day';
			if ($scope.index >= 0){
				$scope.day = {id: me.extra_openings[$scope.index].id, day: me.extra_openings[$scope.index].date.split('-')[2], month: me.extra_openings[$scope.index].date.split('-')[1], year: me.extra_openings[$scope.index].date.split('-')[0]};
				$scope.day.closed = false;
				if (me.extra_openings[$scope.index].start_break === '')
					$scope.day.continued = true;
				else
					$scope.day.continued = false;
				for (i in me.extra_openings[$scope.index])
					if (i !== 'id' && i !== 'date')
						if (me.extra_openings[$scope.index][i] === ''){
							$scope.day[i + '_h'] = '0';
							$scope.day[i + '_m'] = '00';
						} else {
							$scope.day[i + '_h'] = me.extra_openings[$scope.index][i].split(':')[0];
							$scope.day[i + '_m'] = me.extra_openings[$scope.index][i].split(':')[1];
						}
			} else {
				var now = new Date();
				var day = now.getDate();
				var month = now.getMonth() + 1;
				if (day < 10)
					day = '0' + day;
				if (month < 10)
					month = '0' + month;
				$scope.day = {day: day, month: month, year: now.getFullYear(), start_time_h: '0', start_time_m: '00', end_time_h: '0', end_time_m: '00', start_break_h: '0', start_break_m: '00', end_break_h: '0', end_break_m: '00'};
			}
		} else if ($scope.type === 'profile'){
			item = 'salone';
			if (!me.image)
				me.image = '/images/cover-default.png';
			if (me.profile)
				if ($rootScope.colors.indexOf(me.profile.color) >= 0)
					$scope.salone = {image: me.image, description: me.description, profile: {active: me.profile.active, background: me.profile.background, color: me.profile.color, customColor: ''}};
				else
					$scope.salone = {image: me.image, description: me.description, profile: {active: me.profile.active, background: me.profile.background, color: 'custom', customColor: me.profile.color}};
			else
				$scope.salone = {image: me.image, description: me.description, profile: {active: true, background: 0, color: $rootScope.colors[0], customColor: ''}};
		}
		initItem = angular.copy($scope[item]);
	};

	$scope.loadMore = function (){
		if ($scope.searching.value)
			$scope.spage++;
		else
			$scope.page++;
		$scope.$broadcast('scroll.infiniteScrollComplete');
	};

	$scope.$watch('searching.value', function (){
		$scope.spage = 1;
		$ionicScrollDelegate.$getByHandle($scope.type).scrollTop();
	});

	var photoFromCamera = function (){
		navigator.camera.getPicture(
			function (data){
				$scope.$apply(function (){
					$scope.salone.image = 'data:image/png;base64,' + data;
				});
			},
			function (){
			},
			{
				quality: 50,
				destinationType: Camera.DestinationType.DATA_URL,
				correctOrientation: true,
				saveToPhotoAlbum: true,
				allowEdit: false,
				targetWidth: 1920,
				targetHeight: 1920
			}
		);
	};

	var photoFromLibrary = function (){
		navigator.camera.getPicture(
			function (data){
				$scope.$apply(function (){
					$scope.salone.image = 'data:image/png;base64,' + data;
				});
			},
			function (){
			},
			{
				quality: 50,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				destinationType: Camera.DestinationType.DATA_URL,
				correctOrientation: true,
				saveToPhotoAlbum: false,
				allowEdit: false,
				targetWidth: 1920,
				targetHeight: 1920
			}
		);
	};

	$scope.snapAvatar = function (){
		if ($rootScope.online){
			if ($scope.salone.image === '/images/cover-default.png')
				$ionicActionSheet.show({
					buttons: [
						{ text: 'Scatta' },
						{ text: 'Libreria' }
					],
					cancelText: 'Annulla',
					buttonClicked: function (i){
						if (i)
							photoFromLibrary();
						else
							photoFromCamera();
						return true;
					}
				});
			else
				$ionicActionSheet.show({
					buttons: [
						{ text: 'Scatta' },
						{ text: 'Libreria' }
					],
					destructiveText: 'Rimuovi',
					cancelText: 'Annulla',
					destructiveButtonClicked: function (){
						$scope.salone.image = '/images/cover-default.png';
						return true;
					},
					buttonClicked: function (i){
						if (i)
							photoFromLibrary();
						else
							photoFromCamera();
						return true;
					}
				});
		}
	};

	$scope.editPhoto = function (){
		if ($rootScope.online){
			if ($scope.worker.image)
				$ionicActionSheet.show({
					buttons: [
						{ text: 'Scatta' },
						{ text: 'Libreria' },
					],
					destructiveText: 'Rimuovi',
					cancelText: 'Annulla',
					destructiveButtonClicked: function (){
						delete $scope.worker.image;
						return true;
					},
					buttonClicked: function (i){
						if (i)
							$rootScope.photoFromLibrary('worker');
						else
							$rootScope.photoFromCamera('worker');
						return true;
					}
				});
			else
				$ionicActionSheet.show({
					buttons: [
						{ text: 'Scatta' },
						{ text: 'Libreria' },
					],
					cancelText: 'Annulla',
					buttonClicked: function (i){
						if (i)
							$rootScope.photoFromLibrary('worker');
						else
							$rootScope.photoFromCamera('worker');
						return true;
					}
				});
		}
	};

	$scope.editProduct = function (name){
		if ($scope.myproducts[name])
			$scope.salone.products.push(name);
		else {
			var index = $scope.salone.products.indexOf(name);
			if (index >= 0)
				$scope.salone.products.splice(index, 1);
		}
	};

	$scope.clear = function (sub, field, subfield){
		if (subfield){
			$scope[sub][field][subfield] = '';
			setTimeout(function (){
				document.getElementById(subfield).focus();
			}, 100);
		} else {
			$scope[sub][field] = '';
			setTimeout(function (){
				document.getElementById(field).focus();
			}, 100);
		}
	};

	$scope.setClosed = function (){
		$scope.day.closed = !$scope.day.closed;
	};

	$scope.setContinued = function (){
		if (!$scope.day.closed)
			$scope.day.continued = !$scope.day.continued;
	};

	$scope.setInactive = function (){
		$scope.worker.unavailable = !$scope.worker.unavailable;
		$scope.worker.available = !$scope.worker.available;
	};

	$scope.stopEditing = function (){
		if ($scope.index >= 0 && angular.toJson(initItem) !== angular.toJson($scope[item]))
			$scope.edited = true;
		if ($scope.edited)
	        navigator.notification.confirm(
		        'Hai effettuato delle modifiche. Sei sicuro di volerle annullare?',
		        function (i){
		            if (i === 1){
		            	$scope.opened = false;
		                $rootScope.back();
		            }
		        },
		        'Attenzione',
		        ['Si', 'No']
	        );
	    else {
	        $scope.opened = false;
		    $rootScope.back();
	    }
	};

	$scope.save = function (){
		if(localStorage.flag!=0){
			return;
			}
		else{
			localStorage.flag=1;
			Parse.User.become(localStorage.sessiontoken).then(function (user) {
				var user=user;
					if ($rootScope.online){
					if ($scope.type === 'worker'){
						if ($scope.worker.first_name !== '' && $scope.worker.last_name !== ''){
							delete $scope.worker.unavailable;
							if ($scope.worker.role === '')
								$scope.worker.role = 'Stylist';
							var Worker = Parse.Object.extend('Worker');
							var worker = new Worker();
							worker.set('first_name', $scope.worker.first_name);
							worker.set('last_name', $scope.worker.last_name);
							worker.set('role', $scope.worker.role);
							worker.set('available', $scope.worker.available);
							if ($scope.index >= 0)
								worker.set('objectId', me.workers[$scope.index].objectId);
							if (!$scope.worker.image || ($scope.worker.image && $scope.worker.image.url)){
								worker.set('image', $scope.worker.image);
								$scope.opened = false;
								$rootScope.back();
								worker.save(null, {
									success: function (worker){
										if ($scope.index >= 0){
											me.workers[$scope.index] = worker.toJSON();
											window.postMessage({action: 'modsalone', value: me});
											$rootScope.doTip('Modifica effettuata con successo.');
										} else {
											if (!me.workers)
												me.workers = [];
											me.workers.push(worker.toJSON());
											window.postMessage({action: 'modsalone', value: me});
											//var user = Parse.User.current();
											var relation = user.relation('workers');
											relation.add(worker);
											user.save(null, {
												success: function (user){
													$rootScope.doTip('Modifica effettuata con successo.');
												},
												error: function (user, error){
													window.postMessage({action: 'modsalone', value: oldme});
													$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Add Worker', error);
												}
											});
										}
									},
									error: function (worker, error){
										$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Update User Extra Opening', error);
									}
								});
							} else {
								if ($scope.index >= 0)
									$ionicLoading.show({template: 'Modifico lo staff...'});
								else
									$ionicLoading.show({template: 'Aggiungo lo staff...'});
								var image = new Parse.File('worker.png', {base64: $scope.worker.image.replace('data:image/png;base64,', '')}, 'image/png');
								image.save().then(function (){
									$ionicLoading.hide();
									$scope.opened = false;
									$rootScope.back();
									worker.set('image', image);
									worker.save(null, {
										success: function (worker){
											if ($scope.index >= 0){
												me.workers[$scope.index] = worker.toJSON();
												window.postMessage({action: 'modsalone', value: me});
												$rootScope.doTip('Modifica effettuata con successo.');
											} else {
												if (!me.workers)
													me.workers = [];
												me.workers.push(worker.toJSON());
												window.postMessage({action: 'modsalone', value: me});
												//var user = Parse.User.current();
												var relation = user.relation('workers');
												relation.add(worker);
												user.save(null, {
													success: function (user){
														$rootScope.doTip('Modifica effettuata con successo.');
													},
													error: function (user, error){
														window.postMessage({action: 'modsalone', value: oldme});
														$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Add Worker', error);
													}
												});
											}
										},
										error: function (worker, error){
											$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Update User Extra Opening', error);
										}
									});
								}, function (error){
									$ionicLoading.hide();
									$rootScope.doError('Si è verificato un errore nel caricamento della foto.', 'Upload Worker Photo', error);
								});
							}
						} else {
							if ($scope.worker.first_name === '')
								$scope.missing.first_name = true;
							if ($scope.worker.last_name === '')
								$scope.missing.last_name = true;
							$rootScope.doError('Uno o più campi obbligatori non sono stati compilati.', 'Save ' + $rootScope.ucFirst($scope.type));
						}
					} else if ($scope.type === 'service'){
						var Service = Parse.Object.extend('Service');
						var service = new Service();
						service.set('name', $scope.service.name);
						service.set('duration', parseInt($scope.service.duration));
						service.set('price', parseInt($scope.service.price));
						$scope.opened = false;
						$rootScope.back();
						if ($scope.index >= 0)
							service.set('objectId', me.services[$scope.index].objectId);
						service.save(null, {
							success: function (service){
								if ($scope.index >= 0){
									me.services[$scope.index] = service.toJSON();
									window.postMessage({action: 'modsalone', value: me});
									$rootScope.doTip('Modifica effettuata con successo.');
								} else {
									if (!me.services)
										me.services = [];
									me.services.push(service.toJSON());
									window.postMessage({action: 'modsalone', value: me});
									//var user = Parse.User.current();
									var relation = user.relation('services');
									relation.add(service);
									user.save(null, {
										success: function (user){
											$rootScope.doTip('Modifica effettuata con successo.');
										},
										error: function (user, error){
											window.postMessage({action: 'modsalone', value: oldme});
											$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Add Worker', error);
										}
									});
								}
							},
							error: function (worker, error){
								$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Update User Extra Opening', error);
							}
						});
					} else if ($scope.type === 'extra_opening'){
						var months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
						var Extra_Opening = Parse.Object.extend('Extra_Opening');
						var extra_opening = new Extra_Opening();
						extra_opening.set('date', $scope.day.year + '-' + $scope.day.month + '-' + $scope.day.day);
						extra_opening.set('start_time', $scope.day.start_time_h + ':' + $scope.day.start_time_m);
						extra_opening.set('end_time', $scope.day.end_time_h + ':' + $scope.day.end_time_m);
						if ($scope.day.continued){
							extra_opening.set('start_break', '');
							extra_opening.set('end_break', '');
						} else {
							extra_opening.set('start_break', $scope.day.start_break_h + ':' + $scope.day.start_break_m);
							extra_opening.set('end_break', $scope.day.end_break_h + ':' + $scope.day.end_break_m);
						}
						var fulldate = $scope.day.year + '-' + $scope.day.month + '-' + $scope.day.day + 'T23:59:59+01:00';
						var date = new Date(fulldate);
						var month = months[date.getMonth()];
						extra_opening.set('fdate', date.getDate() + ' ' + month + ' ' + date.getFullYear());
						$scope.opened = false;
						$rootScope.back();
						if ($scope.index >= 0)
							extra_opening.set('objectId', me.extra_openings[$scope.index].objectId);
						extra_opening.save(null, {
							success: function (extra_opening){
								if ($scope.index >= 0){
									me.extra_openings[$scope.index] = extra_opening.toJSON();
									window.postMessage({action: 'modsalone', value: me});
									$rootScope.doTip('Modifica effettuata con successo.');
								} else {
									if (!me.extra_openings)
										me.extra_openings = [];
									me.extra_openings.push(extra_opening.toJSON());
									window.postMessage({action: 'modsalone', value: me});
									//var user = Parse.User.current();
									var relation = user.relation('extra_openings');
									relation.add(extra_opening);
									user.save(null, {
										success: function (user){
											$rootScope.doTip('Modifica effettuata con successo.');
										},
										error: function (user, error){
											window.postMessage({action: 'modsalone', value: oldme});
											$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Add User Extra Opening', error);
										}
									});
								}
							},
							error: function (extra_opening, error){
								$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Update User Extra Opening', error);
							}
						});
					}  else if ($scope.type === 'time_table'){
						if ($scope.day.closed){
							me.time_table[$scope.index].start_time = null;
							me.time_table[$scope.index].end_time = null;
							me.time_table[$scope.index].start_break = null;
							me.time_table[$scope.index].end_break = null;
						} else {
							me.time_table[$scope.index].start_time = $scope.day.start_time_h + ':' + $scope.day.start_time_m;
							me.time_table[$scope.index].end_time = $scope.day.end_time_h + ':' + $scope.day.end_time_m;
							if ($scope.day.continued){
								me.time_table[$scope.index].start_break = null;
								me.time_table[$scope.index].end_break = null;
							} else {
								me.time_table[$scope.index].start_break = $scope.day.start_break_h + ':' + $scope.day.start_break_m;
								me.time_table[$scope.index].end_break = $scope.day.end_break_h + ':' + $scope.day.end_break_m;
							}
						}
						window.postMessage({action: 'modsalone', value: me});
						$scope.opened = false;
						$rootScope.back();
						//var user = Parse.User.current();
						user.set('time_table', me.time_table);
						user.save(null, {
							success: function (user){
								$rootScope.doTip('Modifica effettuata con successo.');
							},
							error: function (user, error){
								window.postMessage({action: 'modsalone', value: oldme});
								$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Save User Time Table', error);
							}
						});
					} else if ($scope.type === 'infos' && $scope.salone.workname === ''){
						$scope.missing.workname = true;
						$rootScope.doError('Uno o più campi obbligatori non sono stati compilati.', 'Save Infos');
					} else {
						//var user = Parse.User.current();
						if ($scope.type === 'profile'){
							if ($scope.salone.image === '/images/cover-default.png')
								$scope.salone.image = null;
							if ($scope.salone.profile.color === 'custom')
								if (/#([a-f]|[A-F]|[0-9]){6}/.test($scope.salone.profile.customColor))
									$scope.salone.profile.color = $scope.salone.profile.customColor;
								else {
									$rootScope.doError('Il colore personalizzato non esiste.', 'Save Profile Color');
									return;
								}
							delete $scope.salone.profile.customColor;
						}
						for (i in $scope.salone){
							if (i !== 'image')
								user.set(i, $scope.salone[i]);
							me[i] = $scope.salone[i];
						}
						if ($scope.type === 'profile' && $scope.salone.image && JSON.stringify(initItem.image) !== JSON.stringify($scope.salone.image)){
							$ionicLoading.show({template: 'Aggiorno la copertina...'});
							var imageName = me.objectId + '.png';
							var image = new Parse.File(imageName, {base64: $scope.salone.image.replace('data:image/png;base64,', '')}, 'image/png');
							image.save().then(function (){
								user.set('image', image);
								user.save(null, {
									success: function (user){
										window.postMessage({action: 'modsalone', value: me});
										$scope.opened = false;
										$rootScope.doTip('Modifica effettuata con successo.');
										$ionicLoading.hide();
										$rootScope.back();
									},
									error: function (user, error){
										$rootScope.doError('Si è verificato un errore nell\'aggiornamento della copertina.', 'Save User Cover', error);
										$ionicLoading.hide();
									}
								});
							}, function (error){
								$rootScope.doError('Si è verificato un errore nell\'aggiornamento della copertina.', 'Save User Cover', error);
								$ionicLoading.hide();
							});
						} else {
							window.postMessage({action: 'modsalone', value: me});
							$scope.opened = false;
							$rootScope.back();
							user.save(null, {
								success: function (user){
									$rootScope.doTip('Modifica effettuata con successo.');
								},
								error: function (user, error){
									window.postMessage({action: 'modsalone', value: oldme});
									$rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Save User Data', error);
								}
							});
						}
					}
				}
				// The current user is now set to user.
			  }, function (error) {
				alert(error.message);
			  });
			}
		
	};

	$scope.remove = function (){
		if(localStorage.flag3!=0){
			return;
			}
		else{
			localStorage.flag3=1;
			if ($rootScope.online){
			navigator.notification.confirm(
			    'Sei sicuro di voler rimuovere questo elemento?',
			    function (i){
			    	if (i === 1){
					  Parse.User.become(localStorage.sessiontoken).then(function (user) {
						  var user=user;
						  var item = me[$scope.type + 's'][$scope.index];
						  me[$scope.type + 's'].splice($scope.index, 1);
						  window.postMessage({action: 'modsalone', value: me});
						  $scope.opened = false;
						  $rootScope.back();
						  var relation = user.relation($scope.type + 's');
						  if ($scope.type === 'worker'){
							  var Worker = Parse.Object.extend('Worker');
							  relation.remove(new Worker({id: item.objectId}));
						  } else if ($scope.type === 'service'){
							  var Service = Parse.Object.extend('Service');
							  relation.remove(new Service({id: item.objectId}));
						  } else if ($scope.type === 'extra_opening'){
							  var Extra_Opening = Parse.Object.extend('Extra_Opening');
							  relation.remove(new Extra_Opening({id: item.objectId}));
						  }
						  user.save(null, {
							  success: function (user){
								  $rootScope.doTip('Rimozione effettuata con successo.');
							  },
							  error: function (user, error){
								  window.postMessage({action: 'modsalone', value: oldme});
								  $rootScope.doError('Si è verificato un errore nell\'aggiornamento dei dati.', 'Remove User ' + $rootScope.ucFirst($scope.type), error);
							  }
						  });
					  }, function (error) {
						alert(error.message);
					  });
			    		
					}else{localStorage.flag3=0;}
				},
				'Attenzione',
			    ['Si', 'No']
			);
		}
		}	
		
	};

	window.addEventListener('message', function (e){
		if (e.data.action === 'viewingSettings')
			initialize(e.data);
		else if (e.data.action === 'workerPhoto')
			$scope.$apply(function (){
				$scope.edited = true;
				$scope.worker.image = e.data.value;
			});
	});

	document.addEventListener('visibilitychange', function (){
		if (document.hidden && !$scope.opened){
			$scope.$apply(function (){
				$scope[item] = {};
				$scope.type = '';
				$scope.edited = false;
				$scope.missing = {};
			});
		}
	}, false);
})

.directive('textarea', function (){
    return {
        restrict: 'E',
        scope: {
        },
        link: function (scope, element, attrs){
            element.bind('touchend  touchmove touchstart', function (e){
                e.stopPropagation();
            });
        }
    };
})

.directive('detectFocus', function (){
	return {
		restrict : 'AC',
		link : function (scope, element, attrs){
			var label = document.getElementById(attrs.id).parentNode;
			element.on('focus', function(){
				label.classList.add('has-focus');				
			});      
			element.on('blur', function(){
				label.classList.remove('has-focus');
			});
		}
	}
});

angular.module('shairy.filters', []).filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});