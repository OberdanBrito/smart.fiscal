let ViewInventario = function () {

    let that = this, form, grid, cellform, cellgrid, inventario = new Inventario();

    this.MontaLayout = function (container) {

        let layout = container.attachLayout({
            pattern: '2E',
            offsets: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            cells: [
                {
                    id: 'a',
                    header: false,
                    height: 430
                },
                {
                    id: 'b',
                    header: false,
                }
            ]
        });

        cellform = layout.cells('a');
        cellgrid = layout.cells('b');

        MontaBarraComandos(cellform);
        MontaFormulario(cellform);
        MontaGrid(cellgrid);

    };

    function MontaBarraComandos(cell) {

        cell.detachToolbar();

        cell.attachToolbar({
            icon_path: "./img/toolbar/cadastro/",
            items:[
                {id: "novo", text:"Novo", type: "button", img: "novo.png"},
                {id: "salvar", text:"Salvar", type: "button", img: "salvar.png"},
                {id: "remover", text:"Remover", type: "button", img: "remover.png"},
            ],
            onClick: function (id) {
                switch (id) {
                    case 'novo':
                        that.LimparFormulario();
                        break;
                    case 'salvar':
                        form.validate();
                        break;
                    case 'remover':
                        inventario.Remover(form.getItemValue('id'), AoExecutarOperacao);
                        break;
                }
            }
        });

    }

    this.LimparFormulario = function() {

        form.clear();
        form.setFormData({});
        form.setItemValue('id', null);

    };

    function MontaFormulario(cell) {

        cell.progressOn();
        cell.detachObject(true);
        form = cell.attachForm();
        form.loadStruct(forminventario, function () {

           Inventario.Setor().Listar(function (setores) {
               cell.progressOff();

               if (setores === null)
                   return;

               let combosetores = form.getCombo('setor');
               setores.filter(function (item) {
                   combosetores.addOption(item.id, item.nome);
               });

               Inventario.Situacao().Listar(function (situacoes) {

                   if (situacoes === null)
                       return;

                   let combosituacoes = form.getCombo('situacao');
                   situacoes.filter(function (item) {
                       combosituacoes.addOption(item.id, item.nome);
                   });

               })

           });

        });
        form.setItemValue('foto', 'default.png');


        form.attachEvent("onAfterValidate", function (status){

            if (status === false)
                return;

            cellform.progressOn();

            let dados = form.getFormData();
            dados.valor = converteMoedaFloat(dados.valor);

            dados.responsavel = usuariocorrente.login;
            if (dados.id > 0) {
                inventario.Editar(dados, AoExecutarOperacao);
            } else {
                inventario.Adicionar(dados, AoExecutarOperacao);
            }

        });

        form.attachEvent("onImageUploadSuccess", function(name, value, extra){
            console.info(name, value, extra);
        });

        form.attachEvent("onImageUploadFail", function(name, extra){
            console.error("onImageUploadFail", name, extra);
            dhtmlx.alert({
                title:"GMI",
                type:"alert-error",
                text:"Não foi possível salvar a imagem.\r\nVerifique as permissões de armazenamento deste serviço"
            });

        });

    }

    function AoExecutarOperacao() {

        cellform.progressOff();
        cellgrid.progressOn();
        that.LimparFormulario();

        inventario.Listar(function (registros) {

            cellgrid.progressOff();
            if (registros === null)
                return;

            grid.clearAll();
            grid.parse(registros,"json");
        });
    }

    function MontaGrid(cell) {

        grid = cell.attachGrid();
        grid.setHeader(['Entrada', 'Código', 'Descrição', 'Serial', 'Fornecedor', 'Setor', 'Situação']);
        grid.attachHeader('#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter,#text_filter');
        grid.setColTypes('ro,ro,ro,ro,ro,ro,ro');
        grid.setColSorting('date,str,str,str,str,str,str');
        grid.enableSmartRendering(true);
        grid.enableMultiselect(true);
        grid.init();

        grid.attachEvent("onRowSelect", function (id) {
            cellform.progressOn();
            inventario.Info(id, function (response) {

                cellform.progressOff();

                if (response === null)
                    return;

                let dados = response[0];
                dados.filedate = moment(dados.filedate).format('YYYY-MM-DD HH:mm:ss');
                dados.data_compra = moment(dados.data_compra).format('YYYY-MM-DD HH:mm:ss');
                dados.valor = converteFloatMoeda(dados.valor);
                form.setFormData(dados);
            })
        });

        inventario.Listar(function (cadastro) {

            if (cadastro === null)
                return;

            grid.clearAll();
            grid.parse(cadastro, 'json');

        })

    }
};

let forminventario = [
    {type: 'settings', offsetTop:15, inputWidth:200, labelWidth:140, labelAlign: 'right'},
    {type: "image", name: "foto", url:  "./ws/foto.php", offset: 20,
        imageWidth: 300, imageHeight: 300,
        inputWidth: 305, inputHeight: 305},
    {type: 'newcolumn', offset: 20},
    {type: 'label', label: 'Identificação', labelWidth:200, list:[
        {type: 'calendar', name: 'filedate', required: true, label: 'Entrada:', dateFormat:'%d/%m/%y %H:%i', serverDateFormat:'%y-%m-%d %H:%i'},
        {type: 'template', name: 'id', label: 'Código:'},
        {type: 'input', name: 'descricao', required: true, label: 'Descrição:'},
        {type: 'input', name: 'fabricante', label: 'Fabricante:'},
        {type: 'input', name: 'modelo', label: 'Modelo:'},
        {type: 'input', name: 'codigo_serial', label: 'Código Serial:'},
        {type: 'combo', name: 'situacao', label: 'Situação:', required: true},
        {type: 'combo', name: 'setor', label: 'Setor:', required: true}
    ]},
    {type: 'newcolumn', offset: 20},
    {type: 'label', label: 'Detalhes da aquisição', labelWidth:200, list:[
        {type: 'input', name: 'fornecedor', label: 'Fornecedor:'},
        {type: 'input', name: 'notafiscal', label: 'Nota fiscal:'},
        {type: 'input', name: 'tempo_garantia', label: 'Garantia:'},
        {type: 'input', name: 'valor', label: 'Valor R$:'},
        {type: 'calendar', name: 'data_compra', required: true, label: 'Data da compra:', dateFormat:'%d/%m/%y %H:%i', serverDateFormat:'%y-%m-%d %H:%i'},
        {type: 'input', name: 'observacoes', label: 'Observações:', inputWidth:400, rows:5},
    ]}
];