$(function() {

	var CONTEST_ID, PROBLEM = [];
	var MAX_RETRY = 10;
	var DELAY = 500;
	var BASE_URL = 'https://code.google.com/codejam/contest/' +
			'CONTEST_ID/scoreboard/do/?cmd=GetSourceCode&' +
			'problem=PROBLEM_ID&' +
			'io_set_id=DIFFICULTY&' +
			'username=USERNAME';

	var modalHtml = [
		'<div id="myModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">',
		'<div class="modal-header">',
		'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
		'<h3 id="myModalLabel">Modal header</h3>',
		'</div>',
		'<div class="modal-body">',
		'<pre id="jam-code" class="prettyprint linenums">code goes here</pre>',
		'</div>',
		'<div class="modal-footer">',
		'<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>',
		'</div>',
		'</div>'
	];

	$('body').append(modalHtml.join(''));
	$('#myModal').on('shown', function() {
		$('.modal-body').scrollTop(0);
	});

	$('script').each(function() {
		if (this.src != '') return;
		var source = this.innerHTML, match;
		match = source.match(/GCJ\.contestId = "(\d+)"/);
		if (match) {
			CONTEST_ID = match[1];
		}
		match = source.match(/"id": "\d+"/g);
		match && match.forEach(function(str) {
			var pid = str.match(/\d+/)[0];
			PROBLEM.push(pid);
		});
	});

	function onPreview(problemId, difficulty, username) {
		var url = BASE_URL;
		url = url.replace('CONTEST_ID', CONTEST_ID);
		url = url.replace('PROBLEM_ID', PROBLEM[problemId]);
		url = url.replace('DIFFICULTY', difficulty);
		url = url.replace('USERNAME', username);

		$.ajax({
			type: 'GET',
			mimeType: 'text/plain; charset=x-user-defined',
			url: url
		}).done(function(res) {
			var zip = new JSZip(res);
			var source = zip.file(/.*/)[0];
			$('#jam-code').removeClass('prettyprinted');
			$('#jam-code').text(source.asText());
			prettyPrint();
			var headerText = [
				username,
				'\'s Problem ',
				String.fromCharCode('A'.charCodeAt(0) + problemId),
				' - ',
				difficulty == '0' ? 'Small' : 'Large',
				' (' + source.name + ') '
			];

			$('#myModalLabel').text(headerText.join(''));
			$('#myModal').modal({});
		});
	}

	function addPreview() {
		waitCondition(function() {
			return $('#scb-table-body').children().length != 0;
		}, DELAY).done(function() {
			$('#scb-table-body tr').each(function() {
				var problemId = 0;
				var username = $('.scb-player-name', $(this)).html();
				username = username.replace(/<(img|p) .*>/, '');
				$('.left-bd', $(this)).each(function() {
					var first = true, $node = $(this), difficulty = 0;
					while (first || $node.attr('class') == '') {
						first = false;
						$('.scb-good-mood-text', $node).each(function() {
							var $previewNode = $('<a/>'),
								pid = problemId, dif = difficulty;
							$previewNode.text('view');
							$previewNode.attr('href', 'javascript:;');
							$previewNode.click(function() {
								onPreview(pid, dif, username);
							});
							$previewNode.addClass('preview');
							$previewNode.insertAfter($(this));
						});
						difficulty++;
						$node = $node.next();
					}
					problemId++;
				});
			});
			$('.scb-range-active,.scb-tab-button').each(function() {
				$(this).click(function() {
					waitCondition(function() {
						return $('.preview').length == 0;
					}, DELAY).done(function() {
						addPreview();
					});
				});
			});
		});
	}


	/***
	 * wait 'delay' seconds for every checking until 'condition' returns true
	 */
	function waitCondition(condition /* boolean function */, delay) {
		return waitConditionImpl(condition, delay, 0);
	};

	function waitConditionImpl(condition /* boolean function */, delay, depth) {
		var d = new $.Deferred;
		if (depth > MAX_RETRY) {
			d.reject('content was not loaded successfully');
			return d.promise();
		}
		if (condition()) {
			d.resolve();
		}
		setTimeout(function() {
			waitConditionImpl(condition, delay, depth + 1).done(function() {
				d.resolve();
			}).fail(function() {
				d.reject('Error');
			});
		}, delay);
		return d.promise();
	};

	addPreview();

});
