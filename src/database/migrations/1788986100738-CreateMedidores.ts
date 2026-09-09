import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMedidores1788986100738 implements MigrationInterface {
    name = 'CreateMedidores1788986100738'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`medidores\` (\`id\` varchar(36) NOT NULL, \`identificador\` varchar(255) NOT NULL, \`tipo\` enum ('ENERGIA', 'AGUA', 'GAS') NOT NULL, \`imovel_id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`medidores\` ADD CONSTRAINT \`FK_e18a30dddfd0ca71599dd9e30ac\` FOREIGN KEY (\`imovel_id\`) REFERENCES \`imoveis\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`medidores\` DROP FOREIGN KEY \`FK_e18a30dddfd0ca71599dd9e30ac\``);
        await queryRunner.query(`DROP TABLE \`medidores\``);
    }

}
