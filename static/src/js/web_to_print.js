/** @odoo-module **/
/* Copyright (c) 2015-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
import { WebsiteSale } from '@website_sale/js/website_sale';
import { debounce } from "@web/core/utils/timing";
import { registry } from "@web/core/registry";
import publicWidget from "@web/legacy/js/public/public_widget";
var canvas_drawing_objects = {}, canvas_texts = {}, canvas_imgs = {}, resize_ratio = {};
import { whenReady } from "@odoo/owl";


WebsiteSale.include({

	_submitForm: function () {
		if (this.$form.find('input[name^="web_to_print"]')) {
			var formvals = {};
			$('input[name^="web_to_print"]').each(input => {
				var $input = $(this);
				formvals[`${$input.attr('name')}`] = $input.val();
			})
			$.extend(this.rootProduct, formvals);
		}
		return this._super.apply(this, arguments);
	}
});

export const webToPrint = {

	start() {

		whenReady(() => {

			$('#customize-link').click(ev => {
				var pid = $(ev.currentTarget).closest('form').find('input[name="product_id"]').val();
				window.location.href = '/custom/design/' + pid.toString();
			});


			if ($('.wk_canvas').length) {

				function webToPrintInitialize() {
					$('.wk_loader').show();
					$('.wk_canvas').each(function () {
						var node = $(this);
						var drawing = node.find('canvas');
						canvas_drawing_objects[`obj_drawing_${drawing.data('area-id')}`] = new fabric.Canvas(drawing.attr('id'));
					});
					// setCanvasProperties();
					function objectMoving(e) {
						var obj = e.target;
						if (obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width) {
							return;
						}
						obj.setCoords();
						if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
							obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top);
							obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left);
						}
						if (obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height || obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width) {
							obj.top = Math.min(obj.top, obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top);
							obj.left = Math.min(obj.left, obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left);
						}
					}
					$.each(canvas_drawing_objects, function () {
						this.on('object:moving', objectMoving);
						var id = $(this.getElement()).data('area-id');
						canvas_texts[`obj_text${id}`] = null;
						canvas_imgs[`obj_img${id}`] = null;
					});
					$('.wk_loader').hide();
				}
				webToPrintInitialize();

				function objectSelected(ev) {
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						$('#text-string').val(activeObject.text);
					}
				}


				$.each(canvas_drawing_objects,function () {
					this.on('object:scaling', objectScaling);
				})

				$.each(canvas_drawing_objects,function () {
					this.on('object:moving', objectMoving);

				})

				function objectMoving(ev){
					let { id } = getActiveCanvas();
					var obj = ev.target ? ev.target : ev
					var cords = obj._getLeftTopCoords();

					if (obj.type === 'text') {
						resize_ratio[`object_top${id}`]= cords['y']/obj.canvas.height
						resize_ratio[`object_left${id}`]= cords['x']/obj.canvas.width
					}

					if (obj.type === 'image') {
						resize_ratio[`object_top_img${id}`]= cords['y']/obj.canvas.height
						resize_ratio[`object_left_img${id}`]= cords['x']/obj.canvas.width

					}

				}


				function objectScaling(ev) {
					let { id } = getActiveCanvas();
					var obj = ev.target ? ev.target : ev

					if (obj.type === 'text') {

						const maxTextWidth = obj.canvas.width * 0.95;
						const maxTextHeight = obj.canvas.height * 0.95;
						const currentTextWidth = obj.getScaledWidth();
						const currentTextHeight = obj.getScaledHeight();

						resize_ratio[`object_scaleX${id}`]= obj.scaleX
						resize_ratio[`object_scaleY${id}`]= obj.scaleY

						if (currentTextWidth > maxTextWidth || currentTextHeight > maxTextHeight ) {
							objectResize(obj)
							}
					}

					if (obj.type === 'image') {
						const maxImageWidth = obj.canvas.width * 0.90;
						const maxImageHeight = obj.canvas.height * 0.90;
						const currentImageWidth = obj.getScaledWidth();
						const currentImageHeight = obj.getScaledHeight();

						resize_ratio[`object_scaleX_img${id}`]= obj.scaleX
						resize_ratio[`object_scaleY_img${id}`]= obj.scaleY

						if (currentImageWidth > maxImageWidth || currentImageHeight > maxImageHeight ) {
							objectResize(obj)
							}
					}
				}

				function objectResize(ev) {
					let { id } = getActiveCanvas();
					var obj = ev.target ? ev.target : ev;

					if (obj.type === 'text') {
						const maxTextWidth = obj.canvas.width * 0.95;
						const maxTextHeight = obj.canvas.height * 0.95;
						const currentTextWidth = obj.getScaledWidth();
						const currentTextHeight = obj.getScaledHeight();

						obj.set('top', resize_ratio[`object_top${id}`] * obj.canvas.height);
						obj.set('left', resize_ratio[`object_left${id}`] * obj.canvas.width);

						if (currentTextWidth >= maxTextWidth) {
							const newScaleX = maxTextWidth / obj.getScaledWidth() * obj.scaleX;
							obj.set('scaleX', newScaleX);
						}

						if (currentTextHeight >= maxTextHeight) {
							const newScaleY = maxTextHeight / obj.getScaledHeight() * obj.scaleY;
							obj.set('scaleY', newScaleY);
						}
					}

					if (obj.type === 'image') {
						const maxImageWidth = obj.canvas.width * 0.90;
						const maxImageHeight = obj.canvas.height * 0.90;
						const currentImageWidth = obj.getScaledWidth();
						const currentImageHeight = obj.getScaledHeight();

						obj.set('top', resize_ratio[`object_top_img${id}`] * obj.canvas.height);
						obj.set('left', resize_ratio[`object_left_img${id}`] * obj.canvas.width);

						if (currentImageWidth >= maxImageWidth) {
							const newScaleX = maxImageWidth / obj.getScaledWidth() * obj.scaleX;
							obj.set('scaleX', newScaleX);
						}

						if (currentImageHeight >= maxImageHeight) {
							const newScaleY = maxImageHeight / obj.getScaledHeight() * obj.scaleY;
							obj.set('scaleY', newScaleY);
						}
					}
				}

				function getActiveCanvas() {
					var node = $('.wk_canvas.tab-pane.active');
					var id = node.data('area-id');
					var canvas = canvas_drawing_objects[`obj_drawing_${id}`];
					var drawingarea = node.find('.drawingArea');

					if (!(`width-${id}` in resize_ratio) && !(`height-${id}` in resize_ratio) && !(`top-${id}` in resize_ratio) && !(`left-${id}` in resize_ratio)) {
						resize_ratio[`width-${id}`] = canvas.getWidth();
						resize_ratio[`height-${id}`] = canvas.getHeight();
						resize_ratio[`top-${id}`] = drawingarea.css('top');
						resize_ratio[`left-${id}`] = drawingarea.css('left');
					}

					return {
						canvas: canvas_drawing_objects[`obj_drawing_${id}`],
						id,
						node,
						drawingarea: node.find('.drawingArea')
					};
				}

				$('.add-text').click(function (ev) {
					let { canvas, id, node, drawingarea } = getActiveCanvas();
					var textInput = $(ev.currentTarget).prev('.text-string');
					var text = textInput.val();

					var newText = new fabric.Text(text, {
						left: fabric.util.getRandomInt(0, drawingarea.width()),
						top: fabric.util.getRandomInt(0, drawingarea.height()),
						fontFamily: 'helvetica',
						angle: 0,
						fill: '#000000',
						scaleX: 0.5,
						scaleY: 0.5,
						fontWeight: '',
						hasRotatingPoint: true
					});

					canvas.add(newText);
					resize_ratio[`object_scaleX${id}`] = newText.scaleX;
					resize_ratio[`object_scaleY${id}`] = newText.scaleY;
					newText.set('scaleX', (newText.canvas.width / resize_ratio[`width-${id}`]) * resize_ratio[`object_scaleX${id}`]);
					newText.set('scaleY', (newText.canvas.height / resize_ratio[`height-${id}`]) * resize_ratio[`object_scaleY${id}`]);
					objectResize(newText);
					canvas.centerObject(newText);
					var cords = newText._getLeftTopCoords();
					resize_ratio[`object_top${id}`] = cords['y'] / newText.canvas.height;
					resize_ratio[`object_left${id}`] = cords['x'] / newText.canvas.width;
					canvas.item(canvas.item.length - 1).hasRotatingPoint = true;

					if (!canvas_texts[`obj_text${id}`]) {
						canvas_texts[`obj_text${id}`] = [];
					}
					canvas_texts[`obj_text${id}`].push(newText);

					// Clear the text input field after adding the text
					textInput.val('');
				});

				$('.text-string').keydown(debounce(ev => {
					let { canvas, id, node } = getActiveCanvas();
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						activeObject.set({ 'text': $(ev.currentTarget).val() });
						objectResize(activeObject);
						canvas.renderAll();
					}
				}, 300));

				// Update the textarea when a text object is selected
				function updateTextInputOnSelection() {
					let { canvas, id, node } = getActiveCanvas();

					canvas.on('selection:created', function (ev) {
						var activeObject = ev.selected[0];
						if (activeObject && activeObject.type === 'text') {
							$('.text-string').val(activeObject.text);
						}
					});

					canvas.on('selection:updated', function (ev) {
						var activeObject = ev.selected[0];
						if (activeObject && activeObject.type === 'text') {
							$('.text-string').val(activeObject.text);
						}
					});

					canvas.on('selection:cleared', function () {
						$('.text-string').val('');
					});
				}

				$(document).ready(function () {
					let { canvas, id, node } = getActiveCanvas();
					updateTextInputOnSelection(canvas);
				});

				$(document).on('click', '.rm-text', ev => {
					let { canvas, id, node, drawingarea } = getActiveCanvas();
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						canvas.remove(activeObject);
						const index = canvas_texts[`obj_text${id}`].indexOf(activeObject);
						if (index > -1) {
							canvas_texts[`obj_text${id}`].splice(index, 1);
						}
						// Clear the text input field after removing the text
						$('.text-string').val('');
					}
				});

				function objectDeselected(ev) {
				}

				$(document).on('input', '.add-img', ev => {
					let { canvas, id, node, drawingarea } = getActiveCanvas();
					var img = $(ev.currentTarget);
					if (img[0].files.length == 0) {
						alert('Please select image first');
					}
					else {
						if (!(img[0].files[0].type.split('/')[0] === 'image')) {
							$("#cautionfileAlert").toast('show');
						}
						else {
							var reader = new FileReader();
							reader.readAsDataURL(img[0].files[0]);
							reader.onload = function () {
								fabric.Image.fromURL(reader.result, function (image) {
									image.set({
										left: fabric.util.getRandomInt(0, drawingarea.width() / 2),
										top: fabric.util.getRandomInt(0, drawingarea.height() / 2),
										angle: 0,
										padding: 10,
										cornersize: 10,
										hasRotatingPoint: true
									});
									//image.scale(getRandomNum(0.1, 0.25)).setCoords();
									image.scaleToHeight(100);
									image.scaleToWidth(100);
									if (canvas_imgs[`obj_img${id}`])
										canvas.remove(canvas_imgs[`obj_img${id}`]);
									canvas.add(image);

									var cords = image._getLeftTopCoords()
									resize_ratio[`object_top_img${id}`]= cords['y']/image.canvas.height
									resize_ratio[`object_left_img${id}`]= cords['x']/image.canvas.width

									resize_ratio[`object_scaleX_img${id}`]= image.scaleX
									resize_ratio[`object_scaleY_img${id}`]= image.scaleY
									image.set('scaleX', (image.canvas.width/resize_ratio[`width-${id}`])*resize_ratio[`object_scaleX_img${id}`])
									image.set('scaleY', (image.canvas.height/resize_ratio[`height-${id}`])*resize_ratio[`object_scaleY_img${id}`]);

									objectResize(image)
									canvas_imgs[`obj_img${id}`] = image;
									$(`#add-to-cart-modal input[name="web_to_print_area_${id}_image_name"]`).val(img[0].files[0].name);
									img.next('.img-name').html(img[0].files[0].name);

								});
							};
						}
					}
				});
				$(document).on('click', ".text-bold", function () {
					let { canvas, id, node } = getActiveCanvas();
					var canvas_text = canvas_texts[`obj_text${id}`];
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						activeObject.fontWeight = (activeObject.fontWeight == 'bold' ? '' : 'bold');
						canvas.renderAll();
					}
					else if (canvas_text) {
						canvas_text.fontWeight = (canvas_text.fontWeight == 'bold' ? '' : 'bold');
						canvas.renderAll();
					}
				});
				$(document).on('click', ".text-italic", function () {
					let { canvas, id, node } = getActiveCanvas();
					var canvas_text = canvas_texts[`obj_text${id}`];
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						activeObject.fontStyle = activeObject.fontStyle == "italic" ? '' : "italic";
						canvas.renderAll();
					}
					else if (canvas_text) {
						canvas_text.fontStyle = canvas_text.fontStyle == "italic" ? '' : "italic";
						canvas.renderAll();
					}

				});
				$(document).on('input', '.color-input', function (ev) {
					let { canvas, id, node } = getActiveCanvas();
					var canvas_text = canvas_texts[`obj_text${id}`];
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						activeObject.set({ 'fill': ev.currentTarget.value });
						canvas.renderAll();
					}
					else if (canvas_text) {
						canvas_text.set({ 'fill': ev.currentTarget.value });
						canvas.renderAll();
					}
				});
				$('.font-family + ul li a').click(function () {
					let { canvas, id, node } = getActiveCanvas();
					var canvas_text = canvas_texts[`obj_text${id}`];
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						activeObject.set({
							'fontFamily': $(this).text().toString()
						});
						canvas.renderAll();
					}
					else if (canvas_text) {
						canvas_text.set({
							'fontFamily': $(this).text().toString()
						});
						canvas.renderAll();
					}
				});
				$(".text-strike").click(function () {
					let { canvas, id, node } = getActiveCanvas();
					var canvas_text = canvas_texts[`obj_text${id}`];
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						activeObject.set({
							'linethrough': (activeObject.linethrough == true ? false : true)
						});
						canvas.renderAll();
					}
					else if (canvas_text) {
						canvas_text.set({
							'linethrough': (canvas_text.linethrough == true ? false : true)
						});
						canvas.renderAll();
					}
				});
				$(".text-underline").click(function () {
					let { canvas, id, node } = getActiveCanvas();
					var canvas_text = canvas_texts[`obj_text${id}`];
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						activeObject.set({
							'underline': (activeObject.underline == true ? false : true)
						});
						canvas.renderAll();
					}
					else if (canvas_text) {
						canvas_text.set({
							'underline': (canvas_text.underline == true ? false : true)
						});
						canvas.renderAll();
					}
				});

				$(document).on('click', '.rm-img', ev => {
					let { canvas, id, node, drawingarea } = getActiveCanvas();
					if (canvas_imgs[`obj_img${id}`]) {
						canvas.remove(canvas_imgs[`obj_img${id}`]);
						canvas_imgs[`obj_img${id}`] = null;
						$(`#add-to-cart-modal input[name="web_to_print_area_${id}_image_name"]`).val('False');
						$(ev.currentTarget).closest('.row').find('.img-name').html('');

					}
				});

				$(document).on('click', '.col-5 .cart-small-img', ev => {
					$(ev.currentTarget).closest('.row').prev('.row').find('.col-7 img').attr('src', ev.currentTarget.src);
				});

				var playerList = [];

				// Click event handler for the "Generate Players" button
				$('#generate-players-btn').click(function () {
					var numRows = parseInt($('#num-rows-input').val());
					var dynamicRowsContainer = $('#dynamic-rows-container');
					
					dynamicRowsContainer.empty(); // Clear previous rows
					
					for (var i = 0; i < numRows; i++) {
						var row = $('<div class="row mb-2"></div>'); // Added mb-2 for spacing between rows
						
						var nameInputColumn = $('<div class="col-md-4"></div>');
						var jerseyInputColumn = $('<div class="col-md-4"></div>');
						var sizeInputColumn = $('<div class="col-md-4 d-flex align-items-center"></div>'); // Added d-flex and align-items-center classes
						
						var nameInput = $('<input type="text" class="form-control" placeholder="Player name" name="name[]">');
						var jerseyInput = $('<input type="number" class="form-control" placeholder="Jersey number" name="jersey_number[]">');
						
						// Create a label and select element for size
						var sizeLabel = $('<label for="size' + i + '" class="mr-2">Size:  </label>'); // Added class mr-2 for margin-right
						var sizeSelect = $('<select class="form-control" id="size' + i + '" name="size[]"><option value="XS">XS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXl</option><option value="XXXL">XXXL</option></select>');
						
						nameInputColumn.append(nameInput);
						jerseyInputColumn.append(jerseyInput);
						
						// Append the label and select element to the sizeInputColumn
						sizeInputColumn.append(sizeLabel);
						sizeInputColumn.append(sizeSelect);
						
						row.append(nameInputColumn);
						row.append(jerseyInputColumn);
						row.append(sizeInputColumn);
						
						dynamicRowsContainer.append(row);
					}
				});

				function getPlayerListHtml(players) {
					if (Array.isArray(players) && players.length > 0) {
						// Create the table element
						var table = $('<table/>', {
							'class': 'player-table table table-striped'
						});
				
						// Create the table header
						var thead = $('<thead/>').append(
							$('<tr/>').append(
								$('<th/>', { 'text': 'Name' }),
								$('<th/>', { 'text': 'Jersey Number' }),
								$('<th/>', { 'text': 'Size' })
							)
						);
				
						// Create the table body
						var tbody = $('<tbody/>');
				
						// Add a row for each player
						players.forEach(player => {
							if (player) {
								var row = $('<tr/>').append(
									$('<td/>', { 'text': player.name }),
									$('<td/>', { 'text': player.jerseyNumber }),
									$('<td/>', { 'text': player.size })
								);
								tbody.append(row);
							}
						});
				
						// Append the header and body to the table
						table.append(thead);
						table.append(tbody);
				
						// Return the table's outer HTML
						return table[0].outerHTML;
					}
					return null;
				}

				$('#reset-design').click(function (ev) {
					let { canvas, id, node } = getActiveCanvas();
					canvas_texts[`obj_text${id}`] = null;
					canvas_imgs[`obj_img${id}`] = null;
					$(`#add-to-cart-modal input[name="web_to_print_area_${id}_image_name"]`).val('False');
					canvas.clear();
					$('.img-name').html('');
				
					// Clear the player list from the view
					playerList = []; // Clear the existing player list
					$('#dynamic-rows-container').empty(); // Remove the player list rows from the view
				});

				$('.nav-link.wk-img').click(ev => {
					$('.tab-pane.editor.active').removeClass('active');
					var id = $(ev.currentTarget).data('area-id');
					$(`.tab-pane.editor[id='area_${id}']`).addClass('active');
					setInterval(resizeCanvas, 100);
					// resizeCanvas();
				});

				function get_design_url() {
					let { canvas, id, node, drawingarea } = getActiveCanvas();

					var	image_div = $(`#area_${id}`).children('.img-canvas')[0],
						image = $(image_div).children('img')[0],
						actualWidth = image.naturalWidth,
						ratioL = actualWidth / parseInt(resize_ratio[`left-${id}`],10);

					canvas.discardActiveObject();
					canvas.renderAll();
					var img = node.find('img');
					var prev_value = drawingarea.position();
					var can = document.createElement("canvas");
					can.width = img.width();
					can.height = img.height();
					var bottlectx = can.getContext('2d');
					bottlectx.drawImage(img.get(0), 0, 0, img.width(), img.height());
					bottlectx.drawImage(canvas.getElement(), $(image).width() / ratioL, prev_value.top, canvas.getWidth(), canvas.getHeight());
					return can.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");

				}
				
				function getTextHtml(texts) {
					if (Array.isArray(texts)) {
						return texts.map(text => {
							if (text) {
								var html = $('<div/>', {
									'text': text.text,
									css: {
										'font-weight': text.fontWeight,
										'font-style': text.fontStyle,
										'font-family': text.fontFamily,
										'text-decoration': text.linethrough ? 'line-through' : 'none',
										'color': text.fill
									}
								});
								if (text.underline) {
									$(html).wrapInner('<u></u>');
								}
								return html[0].outerHTML;
							}
							return null;
						}).join('');
					}
					return null;
				}

				function getAllDesign() {
					var hasDesign = false;
					var cr_canvas = $('.wk_canvas.active');
					$('.wk_canvas').each(function () {
						var node = $(this);
						var id = node.data('area-id');
						var canvas = canvas_drawing_objects[`obj_drawing_${id}`];

						var	image_div = $(`#area_${id}`).children('.img-canvas')[0],
							image = $(image_div).children('img')[0],
							actualWidth = image.naturalWidth,
							ratioL = actualWidth / parseInt(resize_ratio[`left-${id}`],10);

						if (!canvas.isEmpty()) {
							canvas.discardActiveObject();
							canvas.renderAll();
							hasDesign = true;
							node.addClass('active');
							var img = node.find('img');
							var drawingarea = node.find('.drawingArea');
							drawingarea.show();
							var prev_value = drawingarea.position();
							var can = document.createElement("canvas");
							can.width = img.width();
							can.height = img.height();
							var bottlectx = can.getContext('2d');
							bottlectx.drawImage(img.get(0), 0, 0, img.width(), img.height());
							bottlectx.drawImage(canvas.getElement(), $(image).width() / ratioL, prev_value.top, canvas.getWidth(), canvas.getHeight());
							$(`#add-to-cart-modal input[name="web_to_print_area_${id}_design"]`).val(can.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream"));
							$(`#add-to-cart-modal input[name="web_to_print_area_${id}_text"]`).val(canvas_texts[`obj_text${id}`] ? getTextHtml(canvas_texts[`obj_text${id}`]) : 'False');
							$(`#add-to-cart-modal input[name="web_to_print_area_${id}_image"]`).val(canvas_imgs[`obj_img${id}`] ? canvas_imgs[`obj_img${id}`].getSrc() : 'False')
							$(`#add-to-cart-modal input[name="web_to_print_area_${id}_players"]`).val(getPlayerListHtml(playerList));
							var img = new Image();
							img.src = can.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
							img.className = 'border mt8 mr8 ml8 cart-small-img';
							img.style = 'width:50px;height:50px;cursor:pointer';
							$('#add-to-cart-modal .col-md-6 .col-5').last().append(img);
						}
					});
					$('.wk_canvas').removeClass('active');
					cr_canvas.addClass('active');
					return hasDesign;
				}

				$('#save-design').click(function (ev) {
					// Show loader
					$('.wk_loader').show();
					
					// Clear the existing player list
					playerList = [];
					
					// Iterate over each row to extract player data
					$('#dynamic-rows-container .row').each(function () {
						var playerName = $(this).find('input[name="name[]"]').val();
						var jerseyNumber = $(this).find('input[name="jersey_number[]"]').val();
						var playerSize = $(this).find('select[name="size[]"]').val();
						
						// Add the player data to the playerList array
						playerList.push({ name: playerName, jerseyNumber: jerseyNumber, size: playerSize });
					});
					
					// Proceed with design save logic
					$('#add-to-cart-modal .col-md-6 .col-5').last().empty();
					var hasDesign = getAllDesign();
					if (!hasDesign) {
						$('.wk_loader').hide();
						ev.stopPropagation();
						$('#add-cart-msg').show().delay(3000).hide(1);
						$('#add-to-cart-modal').modal('hide');
						return;
					}
					
					var img = new Image();
					img.src = $('.cart-small-img').first().attr('src');
					img.className = 'img-thumbnail';
					$('#add-to-cart-modal .col-md-6 .col-7').first().empty();
					$('#add-to-cart-modal .col-md-6 .col-7').first().append(img);
					
					// Hide loader
					$('.wk_loader').hide();
				});

				$('#preview-design').click(function (ev) {
					var modal = $('#preview-design-modal img');
					modal.attr('src', get_design_url());
					$('#preview-design-modal').modal('show');
				});
				$('#design-download').click(function () {
					var dbtn = document.createElement('a');
					dbtn.href = get_design_url();
					dbtn.download = 'design.jpeg';
					dbtn.click();
				});

				$(document).on('input', '.web-to-print-confirm', ev => {
					var $input = $(ev.currentTarget);
					if ($input.is(':checked'))
						$input.closest('div').next('#buy_now').removeClass('disabled');
					else
						$input.closest('div').next('#buy_now').addClass('disabled');
				});


				function resizeCanvas () {
					let { canvas, id, node, drawingarea} = getActiveCanvas();
					var	image_div = $(`#area_${id}`).children('.img-canvas')[0],
						image = $(image_div).children('img')[0],
						actualWidth = image.naturalWidth,
						actualHeight = image.naturalHeight,
						ratioW = actualWidth / resize_ratio[`width-${id}`] ,
						ratioH = actualHeight/ resize_ratio[`height-${id}`] ,
						ratioT = actualHeight / parseInt(resize_ratio[`top-${id}`], 10),
						ratioL = actualWidth / parseInt(resize_ratio[`left-${id}`],10);

						var new_canvas_width = $(image).width() / ratioW
						var new_canvas_height =$(image).height() / ratioH
						var new_left = ((($(`#area_${id}`).width()-$(image).width())/2)+($(image).width() / ratioL))
					canvas.setWidth(new_canvas_width);
					canvas.setHeight(new_canvas_height);

					$.each(canvas.getObjects(),function () {
						objectResize(this)
					 })

					drawingarea.css(({"width":$(image).width() / ratioW, "height":$(image).height() / ratioH , "top":$(image).height() / ratioT,"left":new_left, }))
					canvas.renderAll();
				  };



				// Resize board
				$(window).resize(resizeCanvas);

			}

		});

		// return canvas_drawing_objects

	},

	canvas_drawing_objects : canvas_drawing_objects,

};

registry.category("services").add("web_to_print", webToPrint);

// 	return canvas_drawing_objects
// });
