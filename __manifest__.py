# -*- coding: utf-8 -*-
#################################################################################
# Author      : Webkul Software Pvt. Ltd. (<https://webkul.com/>)
# Copyright(c): 2015-Present Webkul Software Pvt. Ltd.
# License URL : https://store.webkul.com/license.html/
# All Rights Reserved.
#
#
#
# This program is copyright property of the author mentioned above.
# You can`t redistribute it and/or modify it.
#
#
# You should have received a copy of the License along with this program.
# If not, see <https://store.webkul.com/license.html/>


{
    'name': 'Odoo Web To Print',
    'version': '1.0.0',
    'description': """
                Web To Print Odoo addon
                Odoo Customize Product
                Design Product
                Web To Print Customizable Product
                Web To Print Product    
    """,
    'summary': 'This addons lets you customize your products on the odoo website. Customers can make their own design on products using text and images.',
    'author': 'Webkul Software Pvt. Ltd.',
    'website': 'https://store.webkul.com/odoo-web-to-print.html',
    'license': 'Other proprietary',
    'category': 'Website',
    'live_test_url': 'http://odoodemo.webkul.com/?module=web_to_print&lout=0&custom_url=/shop',
    'depends': [
        'website_sale'
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/data.xml',
        'views/res_config_views.xml',
        'views/report.xml',
        'views/sale_views.xml',
        'views/product_template.xml',
        'views/templates.xml'
    ],
    'demo': [
        'demo/demo.xml'
    ],
    "images":['static/description/Banner.gif'],
    'auto_install': False,
    'installable':True,
    'application': True,
    'currency' : 'USD',
    'price' : 99,
    'pre_init_hook': 'pre_init_check',
    'assets': {
        'web.assets_frontend':[
            'web_to_print/static/src/css/webtoprint.css',
            'web_to_print/static/src/js/fabric.min.js',
            'web_to_print/static/src/js/web_to_print.js',
        ],
        'web.assets_backend':[
            'web_to_print/static/src/xml/area_select.xml',
            'web_to_print/static/src/css/jquery-ui.css',
            'web_to_print/static/src/components/**/*',
        ],
    }
}
