import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeituras1789060274487 implements MigrationInterface {
    name = 'CreateLeituras1789060274487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`leituras\` (\`id\` varchar(36) NOT NULL, \`data_hora\` datetime NOT NULL, \`valor\` decimal(12,3) NOT NULL, \`medidor_id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`leituras\` ADD CONSTRAINT \`FK_35b55177419987ba7ce3a775322\` FOREIGN KEY (\`medidor_id\`) REFERENCES \`medidores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leituras\` DROP FOREIGN KEY \`FK_35b55177419987ba7ce3a775322\``);
        await queryRunner.query(`DROP TABLE \`leituras\``);
    }

}
