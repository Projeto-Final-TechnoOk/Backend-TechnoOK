import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLeituraMedidorCascade1789067307769 implements MigrationInterface {
    name = 'UpdateLeituraMedidorCascade1789067307769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`medidores\` DROP FOREIGN KEY \`FK_e18a30dddfd0ca71599dd9e30ac\``);
        await queryRunner.query(`ALTER TABLE \`leituras\` DROP FOREIGN KEY \`FK_35b55177419987ba7ce3a775322\``);
        await queryRunner.query(`ALTER TABLE \`medidores\` ADD CONSTRAINT \`FK_e18a30dddfd0ca71599dd9e30ac\` FOREIGN KEY (\`imovel_id\`) REFERENCES \`imoveis\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`leituras\` ADD CONSTRAINT \`FK_35b55177419987ba7ce3a775322\` FOREIGN KEY (\`medidor_id\`) REFERENCES \`medidores\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leituras\` DROP FOREIGN KEY \`FK_35b55177419987ba7ce3a775322\``);
        await queryRunner.query(`ALTER TABLE \`medidores\` DROP FOREIGN KEY \`FK_e18a30dddfd0ca71599dd9e30ac\``);
        await queryRunner.query(`ALTER TABLE \`leituras\` ADD CONSTRAINT \`FK_35b55177419987ba7ce3a775322\` FOREIGN KEY (\`medidor_id\`) REFERENCES \`medidores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`medidores\` ADD CONSTRAINT \`FK_e18a30dddfd0ca71599dd9e30ac\` FOREIGN KEY (\`imovel_id\`) REFERENCES \`imoveis\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
