let webservice = new Webservice(), usuariocorrente;
dhtmlxEvent(window, 'load', function () {

    console.info('versão 2.0');

    if (!sessionStorage.user) {
        window.location = '../smart.auth/auth.html?system=smart.inventario';
        return;
    }

    usuariocorrente = JSON.parse(sessionStorage.user);

    new SmartInventario().MontaLayout();

});

let SmartInventario = function () {

    let that = this, siderbar;

    this.MontaLayout = function() {

        siderbar = new dhtmlXSideBar({
            parent: document.body,
            template: 'icons_text',
            icons_path: 'img/siderbar/',
            single_cell: false,
            width: 80,
            header: true,
            autohide: false,
            items: [
                {
                    id: 'gestor',
                    text: 'Dashboard',
                    icon: 'gestor.png',
                    selected: false
                },
                {
                    id: 'inventario',
                    text: 'Inventário',
                    icon: 'inventario.png',
                    selected: true
                }
            ]

        });

        siderbar.attachEvent('onSelect', function(id) {
            that.SelecionarOpcao(id);
        });

        that.SelecionarInventario();
    };

    this.SelecionarOpcao = function(id) {
        switch (id) {
            case 'gestor':
                that.SelecionarGestor();
                break;
            case 'inventario':
                that.SelecionarInventario();
                break;
        }
    };

    this.SelecionarGestor = function () {

        siderbar.cells('gestor').progressOn();
        webservice.Request({
            process: 'gmi.gestor',
            params: JSON.stringify({})
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                return;
            }

            let info = JSON.parse(http.response)[0];
            let gestor = new Gestor(JSON.parse(info.gestor)[0]);
            gestor.MontaLayout(siderbar.cells('gestor'), function () {
                siderbar.cells('gestor').progressOff();
            });


        });

    };

    this.SelecionarInventario = function () {
        let inventario = new ViewInventario();
        inventario.MontaLayout(siderbar.cells('inventario'));
    }

};