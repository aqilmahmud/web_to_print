# -*- coding: utf-8 -*-
##############################################################################
# Copyright (c) 2015-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
# See LICENSE file for full copyright and licensing details.
# License URL : <https://store.webkul.com/license.html/>
##############################################################################
import logging, json
import base64
from odoo import _, api, fields, models
from odoo.exceptions import UserError
from odoo.tools import image_process

_logger = logging.getLogger(__name__)

class ProductTemplate(models.Model):

    _inherit = 'product.template'

    is_web_to_print = fields.Boolean(string='Web 2 Print',copy=True)
    custom_area_ids = fields.One2many('product.custom.area', 'product_id', string='',copy=True)

    # -------------------------------------------------------------------------
    # CONSTRAINT METHODS                                        
    # -------------------------------------------------------------------------
    @api.constrains('custom_area_ids')
    def _check_value_availablity(self):
        for record in self:
            if record.is_web_to_print and not record.custom_area_ids:
                raise UserError(_("You cann't save record without custom area field data."))

    @api.model
    def create(self, vals):
        if 'is_web_to_print' in vals and vals['is_web_to_print'] == True and 'custom_area_ids' not in vals:
            raise UserError(_('Please select the image for customization'))
        return super(ProductTemplate,self).create(vals)

    def write(self, vals):
        if 'is_web_to_print' in vals and vals['is_web_to_print'] == True and ('custom_area_ids' not in vals and not self.custom_area_ids):
            raise UserError(_('Please select the image for customization'))
        
        res =  super(ProductTemplate,self).write(vals)

        if 'is_web_to_print' in vals and vals['is_web_to_print'] == True and self.custom_area_ids:
            for rec in self.custom_area_ids:
                if rec.provide_image == False and  rec.provide_text == False:
                    raise UserError(_(f"You have to select atleast one from (Provide Image or Provide Text) in {rec.name}."))

        if not self.custom_area_ids and not self._context.get('disable_web_to_print'):
            self.with_context(disable_web_to_print=True).write({
                'is_web_to_print':False
            })
        return res

class ProductDimension(models.Model):
    _name = 'product.custom.area'
    _description = 'custom area for product template'
    _order = 'sequence'
    name = fields.Char(required=True)
    provide_image = fields.Boolean(string='Provide Image', default=True)
    provide_text = fields.Boolean(string='Provide Text', default=True)
    provide_team_members = fields.Boolean(string='Provide Team Members', default=True)
    width = fields.Char()
    height = fields.Char()
    top = fields.Char()
    left = fields.Char()
    web_image = fields.Binary(required=True)
    sequence = fields.Integer()
    product_id = fields.Many2one('product.template')
    note = fields.Text()
    image_charge = fields.Float("Extra charge for image")
    text_charge = fields.Float("Extra charge for text")

    @api.model
    def create(self,vals):
        for p in ['width','height','top','left']:
            if vals[p] == False:
                raise UserError(_('Area not selected in %s'%vals['name']))
              
        res = super(ProductDimension,self).create(vals)
        seq = self.search([('product_id','=',res.product_id.id)], limit=1, order="sequence DESC")
        res.write({
            'sequence':seq and seq.sequence + 1 or 1 
        })
        return res
    
    @api.constrains('provide_image','provide_text')
    def _check_provide_image_text(self):
        if self.product_id.is_web_to_print == True and  not self.provide_image and not self.provide_text:
                raise UserError(_(f"You have to select atleast one from (Provide Image or Provide Text) in {self.name}."))
        
    @api.constrains('provide_image','provide_text')
    def _check_provide_image_text(self):
        if self.product_id.is_web_to_print == True and  not self.provide_image and not self.provide_text:
                raise UserError(_(f"You have to select atleast one from (Provide Image or Provide Text) in {self.name}."))
        
    @api.model
    def get_canvas_properties(self,id):
        if id:
            rec = self.env['product.custom.area'].browse(int(id))
            return {
                'width':rec.width,
                'height':rec.height,
                'top':rec.top,
                'left':rec.left
            }
        else:
            return {
                'width':200,
                'height':200,
                'top':157,
                'left':71
            }

class ProductProduct(models.Model):

    _inherit = 'product.product'

    def to_json(self):
        product_template = self.env['product.template'].search([
                ('name', '=', self.name)
            ])
        available_sizes = []
        if product_template:
            for variant in product_template.product_variant_ids:
                for val in variant.product_template_attribute_value_ids:
                    if val.attribute_id.is_size_attribute_for_customizable_products:
                        if val.name in available_sizes:
                            continue
                        else:
                            available_sizes.append(val.name)
        return json.dumps({
            'available_sizes': available_sizes,
        })
    
class ProductAttribute(models.Model):

    _inherit = 'product.attribute'
    
    is_size_attribute_for_customizable_products = fields.Boolean(string="Size Attribute for Customizable Products")